# Exercise 10: Layer 2 & Multi-chain Integration

## 🎯 Learning Objectives

By the end of this exercise, you will be able to:

1. **Build multi-chain integration systems** with seamless chain switching and network detection
2. **Implement bridge interfaces** for cross-chain asset transfers and liquidity management
3. **Create Layer 2 monitoring systems** with gas optimization and transaction tracking
4. **Develop cross-chain managers** for coordinated multi-chain operations
5. **Integrate scaling solutions** with Polygon, Arbitrum, Optimism, and other L2 networks

## 📋 Pre-requisites

Before starting this exercise, you should have completed:

- Exercise 01: Web3 Wallet Integration
- Exercise 03: Smart Contract Interaction
- Understanding of Layer 2 solutions and scaling challenges
- Knowledge of bridge protocols and cross-chain mechanisms
- Familiarity with different blockchain networks and their characteristics

## 📚 Introduction

Multi-chain and Layer 2 integration is essential for modern Web3 applications that need to operate across different networks for cost efficiency, speed, and user accessibility. This exercise teaches you to build comprehensive multi-chain systems including chain switching, bridge protocols, L2 optimization, cross-chain interactions, gas optimization, and scaling solutions.

## 🛠️ Setup

You'll implement a complete multi-chain integration system:

### Core Components

1. **ChainSwitcher**: Network detection and seamless chain switching
2. **BridgeInterface**: Cross-chain asset transfers and bridge management
3. **L2Monitor**: Layer 2 transaction tracking and gas optimization
4. **CrossChainManager**: Coordinated multi-chain operation management

### Key Features

- Support for multiple L1 and L2 networks
- Automated bridge protocol integration
- Gas optimization across different networks
- Real-time cross-chain transaction monitoring
- Chain-specific feature detection and optimization
- Unified multi-chain wallet experience

## 📝 Instructions

### Step 1: Implement ChainSwitcher Component

Create comprehensive chain switching and network management:

```typescript
interface NetworkConfig {
  chainId: number;
  name: string;
  shortName: string;
  networkType: 'mainnet' | 'testnet' | 'layer2' | 'sidechain';
  rpcUrls: string[];
  blockExplorerUrls: string[];
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  iconUrl?: string;
  bridgeContracts?: {
    [bridgeName: string]: string;
  };
  gasOptimization?: {
    maxGasPrice: string;
    preferredGasPrice: string;
    gasMultiplier: number;
  };
}

interface ChainCapabilities {
  eip1559: boolean;
  contractDeployment: boolean;
  bridgeSupport: string[];
  dexSupport: string[];
  nftSupport: boolean;
  stakingSupport: boolean;
}

class ChainSwitcher {
  private supportedNetworks = new Map<number, NetworkConfig>();
  private currentChain: number | null = null;
  private capabilities = new Map<number, ChainCapabilities>();
  
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
      rpcUrls: ['https://mainnet.infura.io/v3/', 'https://eth-mainnet.alchemyapi.io/v2/'],
      blockExplorerUrls: ['https://etherscan.io'],
      nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18
      },
      gasOptimization: {
        maxGasPrice: '100000000000', // 100 gwei
        preferredGasPrice: '20000000000', // 20 gwei
        gasMultiplier: 1.1
      }
    });
    
    // Polygon
    this.supportedNetworks.set(137, {
      chainId: 137,
      name: 'Polygon Mainnet',
      shortName: 'matic',
      networkType: 'sidechain',
      rpcUrls: ['https://polygon-rpc.com/', 'https://rpc-mainnet.matic.network'],
      blockExplorerUrls: ['https://polygonscan.com'],
      nativeCurrency: {
        name: 'MATIC',
        symbol: 'MATIC',
        decimals: 18
      },
      bridgeContracts: {
        'polygon-bridge': '0xA0c68C638235ee32657e8f720a23ceC1bFc77C77',
        'pos-bridge': '0x8484Ef722627bf18ca5Ae6BcF031c23E6e922B30'
      },
      gasOptimization: {
        maxGasPrice: '50000000000', // 50 gwei
        preferredGasPrice: '2000000000', // 2 gwei
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
      blockExplorerUrls: ['https://arbiscan.io'],
      nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18
      },
      bridgeContracts: {
        'arbitrum-bridge': '0x8315177aB297bA92A06054cE80a67Ed4DBd7ed3a'
      },
      gasOptimization: {
        maxGasPrice: '1000000000', // 1 gwei
        preferredGasPrice: '100000000', // 0.1 gwei
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
      blockExplorerUrls: ['https://optimistic.etherscan.io'],
      nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18
      },
      bridgeContracts: {
        'optimism-bridge': '0x25ace71c97B33Cc4729CF772ae268934F7ab5fA1'
      }
    });
  }
  
  async getCurrentChain(): Promise<number | null> {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('No wallet detected');
    }
    
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      this.currentChain = parseInt(chainId, 16);
      return this.currentChain;
    } catch (error) {
      console.error('Failed to get current chain:', error);
      return null;
    }
  }
  
  async switchChain(chainId: number): Promise<boolean> {
    const networkConfig = this.supportedNetworks.get(chainId);
    if (!networkConfig) {
      throw new Error(`Unsupported chain: ${chainId}`);
    }
    
    try {
      // Try to switch to the chain
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
      
      this.currentChain = chainId;
      return true;
    } catch (switchError: any) {
      // If the chain hasn't been added to the wallet
      if (switchError.code === 4902) {
        return this.addChain(chainId);
      }
      throw switchError;
    }
  }
  
  private async addChain(chainId: number): Promise<boolean> {
    const networkConfig = this.supportedNetworks.get(chainId);
    if (!networkConfig) {
      throw new Error(`Network config not found for chain: ${chainId}`);
    }
    
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${chainId.toString(16)}`,
          chainName: networkConfig.name,
          nativeCurrency: networkConfig.nativeCurrency,
          rpcUrls: networkConfig.rpcUrls,
          blockExplorerUrls: networkConfig.blockExplorerUrls,
        }],
      });
      
      this.currentChain = chainId;
      return true;
    } catch (error) {
      console.error('Failed to add chain:', error);
      return false;
    }
  }
  
  getNetworkConfig(chainId: number): NetworkConfig | undefined {
    return this.supportedNetworks.get(chainId);
  }
  
  getSupportedNetworks(): NetworkConfig[] {
    return Array.from(this.supportedNetworks.values());
  }
  
  async detectNetworkCapabilities(chainId: number): Promise<ChainCapabilities> {
    const cached = this.capabilities.get(chainId);
    if (cached) return cached;
    
    const networkConfig = this.supportedNetworks.get(chainId);
    if (!networkConfig) {
      throw new Error(`Unknown chain: ${chainId}`);
    }
    
    // Detect capabilities based on chain type and known features
    const capabilities: ChainCapabilities = {
      eip1559: [1, 137, 42161, 10].includes(chainId),
      contractDeployment: true,
      bridgeSupport: Object.keys(networkConfig.bridgeContracts || {}),
      dexSupport: this.getDEXSupport(chainId),
      nftSupport: true,
      stakingSupport: [1, 137].includes(chainId)
    };
    
    this.capabilities.set(chainId, capabilities);
    return capabilities;
  }
  
  private getDEXSupport(chainId: number): string[] {
    const dexMap = {
      1: ['uniswap', 'sushiswap', '1inch', 'curve'],
      137: ['quickswap', 'sushiswap', '1inch', 'curve'],
      42161: ['uniswap', 'sushiswap', 'curve', 'balancer'],
      10: ['uniswap', 'curve', 'velodrome']
    };
    
    return dexMap[chainId as keyof typeof dexMap] || [];
  }
  
  async optimizeGasSettings(chainId: number, transactionType: 'transfer' | 'swap' | 'bridge'): Promise<{
    gasPrice?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    gasLimit: string;
  }> {
    const networkConfig = this.supportedNetworks.get(chainId);
    const capabilities = await this.detectNetworkCapabilities(chainId);
    
    if (!networkConfig) {
      throw new Error(`Unknown chain: ${chainId}`);
    }
    
    // Base gas limits by transaction type
    const gasLimits = {
      transfer: '21000',
      swap: networkConfig.networkType === 'layer2' ? '200000' : '300000',
      bridge: '500000'
    };
    
    if (capabilities.eip1559) {
      // EIP-1559 networks
      const baseFee = await this.getBaseFee(chainId);
      const priorityFee = networkConfig.networkType === 'layer2' ? '1000000000' : '2000000000'; // 1-2 gwei
      
      return {
        maxFeePerGas: (BigInt(baseFee) * BigInt(2) + BigInt(priorityFee)).toString(),
        maxPriorityFeePerGas: priorityFee,
        gasLimit: gasLimits[transactionType]
      };
    } else {
      // Legacy gas pricing
      return {
        gasPrice: networkConfig.gasOptimization?.preferredGasPrice || '20000000000',
        gasLimit: gasLimits[transactionType]
      };
    }
  }
  
  private async getBaseFee(chainId: number): Promise<string> {
    // In a real implementation, this would fetch the current base fee
    // For demo purposes, return estimated base fees
    const baseFees = {
      1: '20000000000', // 20 gwei
      137: '30000000000', // 30 gwei
      42161: '100000000', // 0.1 gwei
      10: '1000000000' // 1 gwei
    };
    
    return baseFees[chainId as keyof typeof baseFees] || '20000000000';
  }
}
```

Key implementation points:
- Support for major L1 and L2 networks
- Automatic chain addition to wallets
- Network capability detection
- Gas optimization per chain
- Chain-specific configuration management

### Step 2: Build BridgeInterface

Create comprehensive bridge protocol integration:

```typescript
interface BridgeRoute {
  id: string;
  name: string;
  fromChain: number;
  toChain: number;
  fromToken: string;
  toToken: string;
  fee: string;
  estimatedTime: number; // in minutes
  minAmount: string;
  maxAmount: string;
  provider: 'hop' | 'across' | 'arbitrum' | 'optimism' | 'polygon' | 'multichain';
  contractAddress: string;
}

interface BridgeTransaction {
  id: string;
  route: BridgeRoute;
  amount: string;
  status: 'pending' | 'confirmed' | 'processing' | 'completed' | 'failed';
  fromTxHash?: string;
  toTxHash?: string;
  estimatedCompletion: number;
  actualCompletion?: number;
}

class BridgeInterface {
  private routes = new Map<string, BridgeRoute[]>();
  private transactions = new Map<string, BridgeTransaction>();
  private providers = {
    hop: 'https://api.hop.exchange',
    across: 'https://api.across.to',
    multichain: 'https://bridgeapi.multichain.org'
  };
  
  constructor() {
    this.initializeBridgeRoutes();
  }
  
  private initializeBridgeRoutes() {
    // Ethereum to Polygon routes
    this.addRoute({
      id: 'eth-polygon-usdc-hop',
      name: 'Hop Protocol',
      fromChain: 1,
      toChain: 137,
      fromToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC on Ethereum
      toToken: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // USDC on Polygon
      fee: '0.1', // 0.1%
      estimatedTime: 10,
      minAmount: '10',
      maxAmount: '1000000',
      provider: 'hop',
      contractAddress: '0x3666f603Cc164936C1b87e207F36BDa3F2bCf0aC'
    });
    
    // Ethereum to Arbitrum
    this.addRoute({
      id: 'eth-arbitrum-eth-native',
      name: 'Arbitrum Native Bridge',
      fromChain: 1,
      toChain: 42161,
      fromToken: '0x0000000000000000000000000000000000000000', // ETH
      toToken: '0x0000000000000000000000000000000000000000', // ETH
      fee: '0',
      estimatedTime: 420, // 7 hours
      minAmount: '0.01',
      maxAmount: '100',
      provider: 'arbitrum',
      contractAddress: '0x8315177aB297bA92A06054cE80a67Ed4DBd7ed3a'
    });
    
    // Fast Ethereum to Arbitrum via Across
    this.addRoute({
      id: 'eth-arbitrum-usdc-across',
      name: 'Across Protocol',
      fromChain: 1,
      toChain: 42161,
      fromToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      toToken: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
      fee: '0.25',
      estimatedTime: 2,
      minAmount: '10',
      maxAmount: '100000',
      provider: 'across',
      contractAddress: '0x4D9079Bb4165aeb4084c526a32695dCfd2F77381'
    });
  }
  
  private addRoute(route: BridgeRoute) {
    const key = `${route.fromChain}-${route.toChain}`;
    if (!this.routes.has(key)) {
      this.routes.set(key, []);
    }
    this.routes.get(key)!.push(route);
  }
  
  async getAvailableRoutes(
    fromChain: number,
    toChain: number,
    token?: string
  ): Promise<BridgeRoute[]> {
    const key = `${fromChain}-${toChain}`;
    const routes = this.routes.get(key) || [];
    
    if (token) {
      return routes.filter(route => 
        route.fromToken.toLowerCase() === token.toLowerCase()
      );
    }
    
    return routes;
  }
  
  async getBestRoute(
    fromChain: number,
    toChain: number,
    token: string,
    amount: string,
    priority: 'cost' | 'speed' = 'cost'
  ): Promise<BridgeRoute | null> {
    const routes = await this.getAvailableRoutes(fromChain, toChain, token);
    
    if (routes.length === 0) {
      return null;
    }
    
    // Filter by amount limits
    const validRoutes = routes.filter(route => {
      const amountBig = parseFloat(amount);
      const minAmount = parseFloat(route.minAmount);
      const maxAmount = parseFloat(route.maxAmount);
      return amountBig >= minAmount && amountBig <= maxAmount;
    });
    
    if (validRoutes.length === 0) {
      return null;
    }
    
    // Sort by priority
    if (priority === 'speed') {
      validRoutes.sort((a, b) => a.estimatedTime - b.estimatedTime);
    } else {
      validRoutes.sort((a, b) => parseFloat(a.fee) - parseFloat(b.fee));
    }
    
    return validRoutes[0];
  }
  
  async initiateBridge(
    route: BridgeRoute,
    amount: string,
    recipientAddress: string
  ): Promise<BridgeTransaction> {
    const transactionId = this.generateTransactionId();
    
    const transaction: BridgeTransaction = {
      id: transactionId,
      route,
      amount,
      status: 'pending',
      estimatedCompletion: Date.now() + route.estimatedTime * 60 * 1000
    };
    
    this.transactions.set(transactionId, transaction);
    
    try {
      // Execute bridge transaction
      const txHash = await this.executeBridge(route, amount, recipientAddress);
      
      transaction.fromTxHash = txHash;
      transaction.status = 'confirmed';
      
      // Start monitoring
      this.monitorBridgeTransaction(transactionId);
      
      return transaction;
    } catch (error) {
      transaction.status = 'failed';
      throw error;
    }
  }
  
  private async executeBridge(
    route: BridgeRoute,
    amount: string,
    recipientAddress: string
  ): Promise<string> {
    switch (route.provider) {
      case 'hop':
        return this.executeHopBridge(route, amount, recipientAddress);
      case 'across':
        return this.executeAcrossBridge(route, amount, recipientAddress);
      case 'arbitrum':
        return this.executeArbitrumBridge(route, amount, recipientAddress);
      case 'optimism':
        return this.executeOptimismBridge(route, amount, recipientAddress);
      default:
        throw new Error(`Unsupported bridge provider: ${route.provider}`);
    }
  }
  
  private async executeHopBridge(
    route: BridgeRoute,
    amount: string,
    recipientAddress: string
  ): Promise<string> {
    // Hop Protocol integration
    const hopSDK = await this.getHopSDK();
    const bridge = hopSDK.bridge(route.fromToken);
    
    const tx = await bridge.send(
      amount,
      route.fromChain,
      route.toChain,
      {
        recipient: recipientAddress,
        deadline: Date.now() + 30 * 60 * 1000 // 30 minutes
      }
    );
    
    return tx.hash;
  }
  
  private async executeAcrossBridge(
    route: BridgeRoute,
    amount: string,
    recipientAddress: string
  ): Promise<string> {
    // Across Protocol integration
    const acrossSDK = await this.getAcrossSDK();
    
    const tx = await acrossSDK.deposit({
      amount,
      token: route.fromToken,
      destinationChainId: route.toChain,
      recipient: recipientAddress
    });
    
    return tx.hash;
  }
  
  private async monitorBridgeTransaction(transactionId: string) {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) return;
    
    // Poll transaction status
    const checkStatus = async () => {
      try {
        const status = await this.getBridgeStatus(transaction);
        
        if (status.status !== transaction.status) {
          transaction.status = status.status;
          
          if (status.toTxHash) {
            transaction.toTxHash = status.toTxHash;
          }
          
          if (status.status === 'completed') {
            transaction.actualCompletion = Date.now();
          }
          
          // Emit status update event
          this.emitStatusUpdate(transactionId, transaction);
        }
        
        if (status.status === 'processing' || status.status === 'confirmed') {
          setTimeout(checkStatus, 30000); // Check every 30 seconds
        }
      } catch (error) {
        console.error('Bridge monitoring error:', error);
        setTimeout(checkStatus, 60000); // Retry in 1 minute
      }
    };
    
    setTimeout(checkStatus, 10000); // Initial delay of 10 seconds
  }
  
  private async getBridgeStatus(transaction: BridgeTransaction): Promise<{
    status: BridgeTransaction['status'];
    toTxHash?: string;
  }> {
    const { route, fromTxHash } = transaction;
    
    switch (route.provider) {
      case 'hop':
        return this.getHopStatus(fromTxHash!);
      case 'across':
        return this.getAcrossStatus(fromTxHash!);
      default:
        // Generic status check
        return { status: 'processing' };
    }
  }
  
  async estimateBridgeFee(route: BridgeRoute, amount: string): Promise<{
    bridgeFee: string;
    gasFee: string;
    totalFee: string;
  }> {
    const bridgeFeePercent = parseFloat(route.fee);
    const bridgeFee = (parseFloat(amount) * bridgeFeePercent / 100).toString();
    
    // Estimate gas fees for both chains
    const fromChainGas = await this.estimateChainGasFee(route.fromChain);
    const toChainGas = await this.estimateChainGasFee(route.toChain);
    const gasFee = (parseFloat(fromChainGas) + parseFloat(toChainGas)).toString();
    
    const totalFee = (parseFloat(bridgeFee) + parseFloat(gasFee)).toString();
    
    return { bridgeFee, gasFee, totalFee };
  }
  
  getBridgeHistory(): BridgeTransaction[] {
    return Array.from(this.transactions.values())
      .sort((a, b) => b.estimatedCompletion - a.estimatedCompletion);
  }
  
  private generateTransactionId(): string {
    return 'bridge_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  private emitStatusUpdate(transactionId: string, transaction: BridgeTransaction) {
    // Emit custom event for status updates
    window.dispatchEvent(new CustomEvent('bridgeStatusUpdate', {
      detail: { transactionId, transaction }
    }));
  }
}
```

### Step 3: Create L2Monitor Component

Implement comprehensive Layer 2 monitoring and optimization:

```typescript
interface L2Metrics {
  chainId: number;
  blockTime: number; // average block time in seconds
  tps: number; // transactions per second
  avgGasPrice: string;
  avgGasUsed: string;
  sequencerStatus: 'active' | 'down' | 'delayed';
  bridgeVolume24h: string;
  tvl: string; // total value locked
}

interface TransactionOptimization {
  originalGasLimit: string;
  optimizedGasLimit: string;
  gasSaved: string;
  optimizations: string[];
}

class L2Monitor {
  private metrics = new Map<number, L2Metrics>();
  private optimizationCache = new Map<string, TransactionOptimization>();
  private sequencerEndpoints = {
    42161: 'https://arb1.arbitrum.io/rpc', // Arbitrum
    10: 'https://mainnet.optimism.io', // Optimism
    137: 'https://polygon-rpc.com/', // Polygon
  };
  
  async getL2Metrics(chainId: number): Promise<L2Metrics> {
    const cached = this.metrics.get(chainId);
    if (cached && Date.now() - cached.blockTime < 60000) { // Cache for 1 minute
      return cached;
    }
    
    const metrics = await this.fetchL2Metrics(chainId);
    this.metrics.set(chainId, metrics);
    return metrics;
  }
  
  private async fetchL2Metrics(chainId: number): Promise<L2Metrics> {
    const endpoint = this.sequencerEndpoints[chainId as keyof typeof this.sequencerEndpoints];
    
    try {
      // Fetch basic network stats
      const [blockTime, gasPrice, sequencerStatus] = await Promise.all([
        this.getAverageBlockTime(endpoint),
        this.getCurrentGasPrice(endpoint),
        this.getSequencerStatus(chainId)
      ]);
      
      return {
        chainId,
        blockTime,
        tps: this.calculateTPS(chainId, blockTime),
        avgGasPrice: gasPrice,
        avgGasUsed: await this.getAverageGasUsed(endpoint),
        sequencerStatus,
        bridgeVolume24h: await this.getBridgeVolume(chainId),
        tvl: await this.getTVL(chainId)
      };
    } catch (error) {
      console.error(`Failed to fetch L2 metrics for chain ${chainId}:`, error);
      
      // Return default metrics
      return {
        chainId,
        blockTime: 2,
        tps: 100,
        avgGasPrice: '1000000000',
        avgGasUsed: '100000',
        sequencerStatus: 'active',
        bridgeVolume24h: '0',
        tvl: '0'
      };
    }
  }
  
  private async getSequencerStatus(chainId: number): Promise<'active' | 'down' | 'delayed'> {
    try {
      const endpoint = this.sequencerEndpoints[chainId as keyof typeof this.sequencerEndpoints];
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1
        })
      });
      
      const data = await response.json();
      const latestBlock = parseInt(data.result, 16);
      
      // Check if the latest block is recent (within last 5 minutes)
      const blockTime = await this.getBlockTimestamp(endpoint, latestBlock);
      const timeDiff = Date.now() - blockTime * 1000;
      
      if (timeDiff > 5 * 60 * 1000) return 'delayed';
      if (timeDiff > 10 * 60 * 1000) return 'down';
      
      return 'active';
    } catch (error) {
      return 'down';
    }
  }
  
  async optimizeTransaction(
    chainId: number,
    transactionData: any
  ): Promise<TransactionOptimization> {
    const cacheKey = `${chainId}-${JSON.stringify(transactionData)}`;
    const cached = this.optimizationCache.get(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const optimization = await this.performOptimization(chainId, transactionData);
    this.optimizationCache.set(cacheKey, optimization);
    
    return optimization;
  }
  
  private async performOptimization(
    chainId: number,
    transactionData: any
  ): Promise<TransactionOptimization> {
    const optimizations: string[] = [];
    let originalGasLimit = transactionData.gasLimit || '300000';
    let optimizedGasLimit = originalGasLimit;
    
    // L2-specific optimizations
    switch (chainId) {
      case 42161: // Arbitrum
        optimizedGasLimit = await this.optimizeForArbitrum(transactionData);
        optimizations.push('Arbitrum gas optimization');
        break;
        
      case 10: // Optimism
        optimizedGasLimit = await this.optimizeForOptimism(transactionData);
        optimizations.push('Optimism gas optimization');
        break;
        
      case 137: // Polygon
        optimizedGasLimit = await this.optimizeForPolygon(transactionData);
        optimizations.push('Polygon gas optimization');
        break;
    }
    
    // General optimizations
    if (transactionData.data && transactionData.data.length > 1000) {
      optimizedGasLimit = (BigInt(optimizedGasLimit) * BigInt(110) / BigInt(100)).toString();
      optimizations.push('Large calldata optimization');
    }
    
    const gasSaved = (BigInt(originalGasLimit) - BigInt(optimizedGasLimit)).toString();
    
    return {
      originalGasLimit,
      optimizedGasLimit,
      gasSaved,
      optimizations
    };
  }
  
  private async optimizeForArbitrum(transactionData: any): Promise<string> {
    // Arbitrum-specific optimization
    // Account for L1 gas costs (calldata compression)
    const baseGas = parseInt(transactionData.gasLimit || '300000');
    const calldataGas = transactionData.data ? 
      (transactionData.data.length - 2) / 2 * 16 : 0; // Rough estimate
    
    const optimizedGas = Math.floor(baseGas * 0.9 + calldataGas);
    return optimizedGas.toString();
  }
  
  private async optimizeForOptimism(transactionData: any): Promise<string> {
    // Optimism-specific optimization
    // Account for L1 security fee
    const baseGas = parseInt(transactionData.gasLimit || '300000');
    const optimizedGas = Math.floor(baseGas * 0.95); // Generally lower gas usage
    
    return optimizedGas.toString();
  }
  
  private async optimizeForPolygon(transactionData: any): Promise<string> {
    // Polygon-specific optimization
    const baseGas = parseInt(transactionData.gasLimit || '300000');
    const optimizedGas = Math.floor(baseGas * 1.1); // Account for network congestion
    
    return optimizedGas.toString();
  }
  
  async getBatchOptimization(transactions: any[]): Promise<{
    canBatch: boolean;
    batchedGasLimit: string;
    individualGasLimit: string;
    gasSavings: string;
  }> {
    // Check if transactions can be batched
    const canBatch = this.canBatchTransactions(transactions);
    
    if (!canBatch) {
      const individualGasLimit = transactions
        .reduce((sum, tx) => sum + parseInt(tx.gasLimit || '300000'), 0)
        .toString();
      
      return {
        canBatch: false,
        batchedGasLimit: '0',
        individualGasLimit,
        gasSavings: '0'
      };
    }
    
    // Calculate batched gas limit
    const individualGasLimit = transactions
      .reduce((sum, tx) => sum + parseInt(tx.gasLimit || '300000'), 0);
    
    const batchOverhead = 50000; // Base overhead for batch transaction
    const batchedGasLimit = Math.floor(individualGasLimit * 0.8) + batchOverhead;
    
    const gasSavings = individualGasLimit - batchedGasLimit;
    
    return {
      canBatch: true,
      batchedGasLimit: batchedGasLimit.toString(),
      individualGasLimit: individualGasLimit.toString(),
      gasSavings: gasSavings.toString()
    };
  }
  
  private canBatchTransactions(transactions: any[]): boolean {
    // Check if all transactions are for the same contract
    const contracts = new Set(transactions.map(tx => tx.to));
    if (contracts.size > 1) return false;
    
    // Check if all transactions are state-changing
    const allStateChanging = transactions.every(tx => 
      tx.data && tx.data !== '0x' && tx.value === '0'
    );
    
    return allStateChanging;
  }
  
  async monitorL2Health(): Promise<{
    healthy: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Check all supported L2s
    const l2Chains = [42161, 10, 137];
    
    for (const chainId of l2Chains) {
      try {
        const metrics = await this.getL2Metrics(chainId);
        
        if (metrics.sequencerStatus !== 'active') {
          issues.push(`${this.getChainName(chainId)} sequencer is ${metrics.sequencerStatus}`);
          recommendations.push(`Consider using alternative L2 or wait for ${this.getChainName(chainId)} recovery`);
        }
        
        if (parseFloat(metrics.avgGasPrice) > this.getGasThreshold(chainId)) {
          issues.push(`High gas prices on ${this.getChainName(chainId)}`);
          recommendations.push(`Consider batching transactions or switching to lower-cost L2`);
        }
        
        if (metrics.tps < 10) {
          issues.push(`Low TPS on ${this.getChainName(chainId)}: ${metrics.tps}`);
          recommendations.push(`Network congestion detected on ${this.getChainName(chainId)}`);
        }
      } catch (error) {
        issues.push(`Failed to monitor ${this.getChainName(chainId)}`);
      }
    }
    
    return {
      healthy: issues.length === 0,
      issues,
      recommendations
    };
  }
  
  private getChainName(chainId: number): string {
    const names = {
      42161: 'Arbitrum',
      10: 'Optimism',
      137: 'Polygon'
    };
    return names[chainId as keyof typeof names] || `Chain ${chainId}`;
  }
  
  private getGasThreshold(chainId: number): number {
    // Gas price thresholds in wei
    const thresholds = {
      42161: 1000000000, // 1 gwei for Arbitrum
      10: 1000000000,    // 1 gwei for Optimism
      137: 50000000000   // 50 gwei for Polygon
    };
    return thresholds[chainId as keyof typeof thresholds] || 20000000000;
  }
}
```

### Step 4: Implement CrossChainManager

Create coordinated multi-chain operation management:

```typescript
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
  gasUsed?: string;
  blockNumber?: number;
  dependsOn: string[];
}

class CrossChainManager {
  private operations = new Map<string, CrossChainOperation>();
  private chainProviders = new Map<number, any>();
  
  async executeArbitrage(
    token: string,
    amount: string,
    sourceChain: number,
    targetChain: number,
    minProfitBps: number = 50 // 0.5% minimum profit
  ): Promise<CrossChainOperation> {
    const operationId = this.generateOperationId('arbitrage');
    
    const operation: CrossChainOperation = {
      id: operationId,
      type: 'arbitrage',
      chains: [sourceChain, targetChain],
      status: 'pending',
      steps: [],
      totalValue: amount,
      estimatedDuration: 15 * 60, // 15 minutes
    };
    
    // Step 1: Check prices on both chains
    operation.steps.push({
      id: 'price_check_source',
      chainId: sourceChain,
      action: 'Check token price',
      status: 'pending',
      dependsOn: []
    });
    
    operation.steps.push({
      id: 'price_check_target',
      chainId: targetChain,
      action: 'Check token price',
      status: 'pending',
      dependsOn: []
    });
    
    // Step 2: Bridge tokens if profitable
    operation.steps.push({
      id: 'bridge_tokens',
      chainId: sourceChain,
      action: `Bridge ${amount} ${token} to chain ${targetChain}`,
      status: 'pending',
      dependsOn: ['price_check_source', 'price_check_target']
    });
    
    // Step 3: Execute swap on target chain
    operation.steps.push({
      id: 'execute_swap',
      chainId: targetChain,
      action: 'Execute arbitrage swap',
      status: 'pending',
      dependsOn: ['bridge_tokens']
    });
    
    this.operations.set(operationId, operation);
    
    // Execute operation
    this.executeOperation(operationId);
    
    return operation;
  }
  
  async executeYieldFarming(
    strategies: Array<{
      chainId: number;
      protocol: string;
      token: string;
      amount: string;
      expectedApy: number;
    }>
  ): Promise<CrossChainOperation> {
    const operationId = this.generateOperationId('yield');
    
    const operation: CrossChainOperation = {
      id: operationId,
      type: 'yield',
      chains: strategies.map(s => s.chainId),
      status: 'pending',
      steps: [],
      totalValue: strategies.reduce((sum, s) => 
        (parseFloat(sum) + parseFloat(s.amount)).toString(), '0'
      ),
      estimatedDuration: 20 * 60, // 20 minutes
    };
    
    // Generate steps for each strategy
    strategies.forEach((strategy, index) => {
      const stepId = `yield_${index}`;
      
      operation.steps.push({
        id: stepId,
        chainId: strategy.chainId,
        action: `Deposit ${strategy.amount} ${strategy.token} to ${strategy.protocol}`,
        status: 'pending',
        dependsOn: []
      });
    });
    
    this.operations.set(operationId, operation);
    this.executeOperation(operationId);
    
    return operation;
  }
  
  async executeCrossChainGovernance(
    proposals: Array<{
      chainId: number;
      contractAddress: string;
      action: string;
      params: any[];
    }>
  ): Promise<CrossChainOperation> {
    const operationId = this.generateOperationId('governance');
    
    const operation: CrossChainOperation = {
      id: operationId,
      type: 'governance',
      chains: proposals.map(p => p.chainId),
      status: 'pending',
      steps: [],
      totalValue: '0',
      estimatedDuration: 30 * 60, // 30 minutes
    };
    
    proposals.forEach((proposal, index) => {
      operation.steps.push({
        id: `governance_${index}`,
        chainId: proposal.chainId,
        action: `Execute governance action: ${proposal.action}`,
        status: 'pending',
        dependsOn: index > 0 ? [`governance_${index - 1}`] : []
      });
    });
    
    this.operations.set(operationId, operation);
    this.executeOperation(operationId);
    
    return operation;
  }
  
  private async executeOperation(operationId: string) {
    const operation = this.operations.get(operationId);
    if (!operation) return;
    
    operation.status = 'executing';
    const startTime = Date.now();
    
    try {
      // Execute steps in dependency order
      const executed = new Set<string>();
      
      while (executed.size < operation.steps.length) {
        const readySteps = operation.steps.filter(step => 
          step.status === 'pending' && 
          step.dependsOn.every(dep => executed.has(dep))
        );
        
        if (readySteps.length === 0) {
          // Check if we're stuck
          const pendingSteps = operation.steps.filter(s => s.status === 'pending');
          if (pendingSteps.length > 0) {
            throw new Error('Dependency deadlock detected');
          }
          break;
        }
        
        // Execute ready steps in parallel
        await Promise.all(
          readySteps.map(step => this.executeStep(step))
        );
        
        readySteps.forEach(step => executed.add(step.id));
      }
      
      // Check final status
      const failedSteps = operation.steps.filter(s => s.status === 'failed');
      const completedSteps = operation.steps.filter(s => s.status === 'completed');
      
      if (failedSteps.length > 0) {
        operation.status = completedSteps.length > 0 ? 'partial' : 'failed';
      } else {
        operation.status = 'completed';
      }
      
      operation.actualDuration = Math.floor((Date.now() - startTime) / 1000);
      
    } catch (error) {
      console.error('Cross-chain operation failed:', error);
      operation.status = 'failed';
    }
    
    // Emit completion event
    this.emitOperationUpdate(operationId, operation);
  }
  
  private async executeStep(step: CrossChainStep): Promise<void> {
    step.status = 'executing';
    
    try {
      const provider = this.getProvider(step.chainId);
      
      // Execute step based on action type
      const result = await this.performStepAction(step, provider);
      
      if (result.txHash) {
        step.txHash = result.txHash;
        step.gasUsed = result.gasUsed;
        step.blockNumber = result.blockNumber;
      }
      
      step.status = 'completed';
    } catch (error) {
      console.error(`Step ${step.id} failed:`, error);
      step.status = 'failed';
    }
  }
  
  private async performStepAction(step: CrossChainStep, provider: any): Promise<{
    txHash?: string;
    gasUsed?: string;
    blockNumber?: number;
  }> {
    // Mock implementation - in real app, this would execute actual blockchain transactions
    await new Promise(resolve => setTimeout(resolve, Math.random() * 5000 + 2000));
    
    return {
      txHash: '0x' + Math.random().toString(16).substr(2, 64),
      gasUsed: Math.floor(Math.random() * 200000 + 50000).toString(),
      blockNumber: Math.floor(Math.random() * 1000000 + 18000000)
    };
  }
  
  async getOperationStatus(operationId: string): Promise<CrossChainOperation | null> {
    return this.operations.get(operationId) || null;
  }
  
  async getAllOperations(): Promise<CrossChainOperation[]> {
    return Array.from(this.operations.values())
      .sort((a, b) => b.estimatedDuration - a.estimatedDuration);
  }
  
  async cancelOperation(operationId: string): Promise<boolean> {
    const operation = this.operations.get(operationId);
    if (!operation || operation.status === 'completed') {
      return false;
    }
    
    // Cancel pending steps
    operation.steps.forEach(step => {
      if (step.status === 'pending') {
        step.status = 'failed';
      }
    });
    
    operation.status = 'failed';
    return true;
  }
  
  private generateOperationId(type: string): string {
    return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }
  
  private getProvider(chainId: number): any {
    // Return cached provider or create new one
    if (!this.chainProviders.has(chainId)) {
      // In real implementation, create ethers provider for the chain
      this.chainProviders.set(chainId, { chainId });
    }
    
    return this.chainProviders.get(chainId);
  }
  
  private emitOperationUpdate(operationId: string, operation: CrossChainOperation) {
    window.dispatchEvent(new CustomEvent('crossChainOperationUpdate', {
      detail: { operationId, operation }
    }));
  }
}
```

## 💡 Hints

### Chain Integration Best Practices

```typescript
// Efficient chain detection
const detectOptimalChain = async (
  operation: 'swap' | 'bridge' | 'stake',
  tokens: string[],
  amount: string
): Promise<number> => {
  const candidates = [1, 137, 42161, 10]; // ETH, Polygon, Arbitrum, Optimism
  const scores = new Map<number, number>();
  
  for (const chainId of candidates) {
    let score = 0;
    
    // Gas cost factor
    const gasPrice = await getGasPrice(chainId);
    score += (100 - gasPrice / 1e9); // Lower gas = higher score
    
    // Liquidity factor
    const liquidity = await getLiquidity(chainId, tokens);
    score += Math.min(liquidity / 1000000, 50); // Up to 50 points for liquidity
    
    // Network health factor
    const health = await getNetworkHealth(chainId);
    score += health * 30; // Up to 30 points for health
    
    scores.set(chainId, score);
  }
  
  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])[0][0];
};
```

## 🔍 Debugging Tips

1. **Chain Switching**: Test with multiple networks and wallet configurations
2. **Bridge Monitoring**: Implement comprehensive transaction tracking
3. **Gas Optimization**: Validate savings across different scenarios  
4. **Cross-chain Operations**: Handle partial failures gracefully
5. **Provider Management**: Ensure robust RPC endpoint failover

## ✅ Checklist

Before submitting your solution, ensure:

- [ ] Chain switcher supports major L1 and L2 networks
- [ ] Bridge interface handles multiple protocols correctly
- [ ] L2 monitor provides accurate metrics and optimizations
- [ ] Cross-chain manager coordinates complex operations
- [ ] Gas optimization works across different networks
- [ ] Bridge transactions are monitored end-to-end
- [ ] Error handling covers network failures
- [ ] User interfaces are responsive and informative
- [ ] Chain-specific optimizations are implemented
- [ ] Multi-chain state is synchronized properly

## 🚀 Extensions

Once you've completed the basic requirements, try:

1. **MEV Protection**: Implement flashbots integration for private mempools
2. **Advanced Bridges**: Add support for more bridge protocols
3. **Yield Optimization**: Implement cross-chain yield farming strategies
4. **L3 Integration**: Add support for application-specific chains
5. **Governance Coordination**: Multi-chain DAO voting systems

## 📚 Resources

- [Polygon SDK Documentation](https://docs.polygon.technology/)
- [Arbitrum Developer Guide](https://developer.arbitrum.io/)
- [Optimism Integration Guide](https://community.optimism.io/docs/developers/)
- [Hop Protocol Documentation](https://docs.hop.exchange/)
- [Across Protocol Docs](https://docs.across.to/)
- [Multichain Bridge API](https://bridgeapi.multichain.org/docs)
- [Layer 2 Ecosystem](https://l2beat.com/)