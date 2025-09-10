# Exercise 03: Smart Contract Interaction

## 🎯 Learning Objectives

By the end of this exercise, you will be able to:

1. **Integrate smart contracts** with React using ethers.js
2. **Implement transaction lifecycle management** from submission to confirmation
3. **Handle contract events** and real-time updates
4. **Optimize gas estimation** and transaction parameters
5. **Generate TypeScript types** from contract ABIs using TypeChain

## 📋 Pre-requisites

Before starting this exercise, you should have completed:

- Exercise 01: Web3 Wallet Integration
- Exercise 02: Blockchain Data Fetching
- Understanding of smart contract ABIs
- Basic knowledge of Ethereum transactions

## 📚 Introduction

Smart contract interaction is at the heart of DeFi applications. This exercise teaches you to implement production-ready patterns for contract integration, manage complex transaction lifecycles, handle events efficiently, and create type-safe interfaces that prevent runtime errors.

## 🛠️ Setup

You'll implement a comprehensive smart contract interaction system:

### Core Components

1. **ContractProvider**: Manages contract instances and connections
2. **TransactionManager**: Handles transaction lifecycle and status
3. **GasEstimator**: Optimizes gas settings for transactions
4. **EventListener**: Manages contract event subscriptions

### Key Features

- Type-safe contract interfaces with TypeChain
- Transaction status tracking and notifications
- Gas optimization and fee estimation
- Event filtering and real-time updates
- Error recovery and retry mechanisms

## 📝 Instructions

### Step 1: Create ContractProvider with Type Safety

Implement a provider that manages typed contract instances:

```typescript
interface ContractConfig {
  address: string;
  abi: any[];
  provider: ethers.providers.Provider;
  signer?: ethers.Signer;
}

class ContractProvider<T extends ethers.Contract> {
  private contract: T;
  
  constructor(config: ContractConfig) {
    // Initialize typed contract
  }
  
  async read<K extends keyof T>(
    method: K,
    ...args: Parameters<T[K]>
  ): Promise<ReturnType<T[K]>> {
    // Type-safe read methods
  }
  
  async write<K extends keyof T>(
    method: K,
    ...args: Parameters<T[K]>
  ): Promise<ethers.ContractTransaction> {
    // Type-safe write methods
  }
}
```

Key implementation points:
- Use TypeChain for automatic type generation
- Implement method overloading for different call types
- Handle both read and write operations
- Manage contract upgrades and migrations

### Step 2: Build TransactionManager Component

Create a component that manages transaction lifecycle:

```typescript
interface TransactionState {
  hash: string;
  status: 'pending' | 'confirming' | 'confirmed' | 'failed';
  confirmations: number;
  error?: Error;
  receipt?: ethers.providers.TransactionReceipt;
}

const useTransactionManager = () => {
  const [transactions, setTransactions] = useState<Map<string, TransactionState>>();
  
  const sendTransaction = async (
    tx: () => Promise<ethers.ContractTransaction>
  ) => {
    // Handle transaction submission
    // Track status updates
    // Manage confirmations
  };
  
  return { sendTransaction, transactions };
};
```

Features to implement:
- Transaction queue management
- Status updates via polling/events
- Confirmation tracking
- Error handling and retry logic
- User notifications

### Step 3: Implement GasEstimator

Build smart gas estimation and optimization:

```typescript
interface GasSettings {
  gasLimit: ethers.BigNumber;
  maxFeePerGas?: ethers.BigNumber;
  maxPriorityFeePerGas?: ethers.BigNumber;
  gasPrice?: ethers.BigNumber;
}

class GasEstimator {
  async estimateGas(
    contract: ethers.Contract,
    method: string,
    args: any[]
  ): Promise<GasSettings> {
    // Estimate gas with buffer
    // Fetch current gas prices
    // Optimize for EIP-1559
  }
  
  async getGasPriceRecommendations(): Promise<{
    slow: ethers.BigNumber;
    standard: ethers.BigNumber;
    fast: ethers.BigNumber;
  }> {
    // Fetch gas price recommendations
  }
}
```

Optimization techniques:
- Add safety buffer to gas estimates
- Implement EIP-1559 support
- Provide speed/cost trade-offs
- Cache recent estimates
- Handle gas spikes

### Step 4: Create EventListener System

Implement efficient event subscription management:

```typescript
class EventListener {
  private subscriptions = new Map<string, ethers.providers.Listener>();
  
  subscribe(
    contract: ethers.Contract,
    eventName: string,
    filter?: any,
    callback?: (event: any) => void
  ) {
    const eventFilter = contract.filters[eventName](...(filter || []));
    
    const listener = (...args: any[]) => {
      // Process event
      callback?.(args);
    };
    
    contract.on(eventFilter, listener);
    
    return () => {
      contract.off(eventFilter, listener);
    };
  }
  
  async queryPastEvents(
    contract: ethers.Contract,
    eventName: string,
    fromBlock: number,
    toBlock: number
  ) {
    // Query historical events
  }
}
```

### Step 5: Build Complete DeFi Interaction Example

Create a real-world token swap interface:

```typescript
const TokenSwap: React.FC = () => {
  const [inputAmount, setInputAmount] = useState('');
  const [outputAmount, setOutputAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  
  const executeSwap = async () => {
    // Approve token if needed
    // Estimate output amount
    // Calculate minimum output with slippage
    // Execute swap transaction
    // Track transaction status
  };
  
  return (
    // Swap interface UI
  );
};
```

## 💡 Hints

### Type-Safe Contract Calls

```typescript
// With TypeChain generated types
import { ERC20__factory } from './typechain';

const contract = ERC20__factory.connect(address, signer);
const balance = await contract.balanceOf(userAddress); // Fully typed!
```

### Transaction Lifecycle Management

```typescript
const trackTransaction = async (txHash: string) => {
  const tx = await provider.getTransaction(txHash);
  
  // Wait for first confirmation
  const receipt = await tx.wait(1);
  
  // Track additional confirmations
  const confirmations = await tx.wait(6);
  
  return { receipt, confirmations };
};
```

### Gas Price Strategies

```typescript
const getOptimalGasPrice = async () => {
  const block = await provider.getBlock('latest');
  const baseFee = block.baseFeePerGas;
  
  // EIP-1559 calculation
  const maxPriorityFee = ethers.utils.parseUnits('2', 'gwei');
  const maxFee = baseFee.mul(2).add(maxPriorityFee);
  
  return { maxFeePerGas: maxFee, maxPriorityFeePerGas: maxPriorityFee };
};
```

## 🎓 Learning Notes

### Security Best Practices

1. **Always validate inputs** before contract calls
2. **Check allowances** before token transfers
3. **Implement slippage protection** for swaps
4. **Use multicall** for atomic operations
5. **Validate contract addresses** against known deployments

### Gas Optimization

1. **Batch operations** when possible
2. **Use gas tokens** during high fee periods
3. **Implement gas price caps** to prevent overspending
4. **Cache read operations** that don't change
5. **Optimize data structures** in contract calls

### Error Handling Patterns

```typescript
try {
  const tx = await contract.method();
  await tx.wait();
} catch (error) {
  if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
    // Handle gas estimation failure
  } else if (error.code === 'INSUFFICIENT_FUNDS') {
    // Handle insufficient balance
  } else if (error.code === 'CALL_EXCEPTION') {
    // Handle contract revert
    console.error('Revert reason:', error.reason);
  }
}
```

## 🔍 Debugging Tips

1. **Use Tenderly** for transaction simulation
2. **Check gas estimates** before sending
3. **Verify contract source** on Etherscan
4. **Test on testnets** first
5. **Log all transaction hashes** for debugging

## ✅ Checklist

Before submitting your solution, ensure:

- [ ] Contract integration is type-safe
- [ ] Transaction lifecycle is properly managed
- [ ] Gas estimation includes safety buffer
- [ ] Events are subscribed and cleaned up
- [ ] Error messages are user-friendly
- [ ] Loading states are implemented
- [ ] Retry logic is in place
- [ ] Slippage protection works
- [ ] TypeScript types are comprehensive
- [ ] Memory leaks are prevented

## 🚀 Extensions

Once you've completed the basic requirements, try:

1. **Permit Signatures**: Implement gasless approvals
2. **Flash Loans**: Add flash loan integration
3. **MEV Protection**: Implement flashbots integration
4. **Cross-chain**: Add bridge interactions
5. **Advanced DeFi**: Build yield farming interface

## 📚 Resources

- [ethers.js Contract Documentation](https://docs.ethers.io/v5/api/contract/)
- [TypeChain GitHub](https://github.com/dethcrypto/TypeChain)
- [EIP-1559 Specification](https://eips.ethereum.org/EIPS/eip-1559)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Ethereum JSON-RPC Specification](https://ethereum.org/en/developers/docs/apis/json-rpc/)