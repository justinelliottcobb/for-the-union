# Exercise 02: Blockchain Data Fetching

## 🎯 Learning Objectives

By the end of this exercise, you will be able to:

1. **Implement efficient blockchain data fetching** patterns with RPC providers
2. **Integrate with professional RPC services** like Alchemy and Infura
3. **Cache blockchain data** using TanStack Query for optimal performance
4. **Handle real-time blockchain updates** and events
5. **Implement fallback providers** and error recovery mechanisms

## 📋 Pre-requisites

Before starting this exercise, you should have completed:

- Exercise 01: Web3 Wallet Integration
- Understanding of React Query/TanStack Query
- Basic knowledge of Ethereum RPC methods
- TypeScript for blockchain data types

## 📚 Introduction

Efficient blockchain data fetching is crucial for building responsive DeFi applications. This exercise teaches you to implement production-ready patterns for fetching on-chain data, managing caching strategies, handling real-time updates, and ensuring reliability through fallback mechanisms.

## 🛠️ Setup

You'll implement a comprehensive blockchain data fetching system:

### Core Components

1. **BlockchainProvider**: Manages RPC connections and fallback logic
2. **TransactionHistory**: Displays user transaction history
3. **BalanceDisplay**: Shows token balances with real-time updates
4. **TokenList**: Manages and displays multiple token balances

### Key Features

- Multiple RPC provider support with automatic fallback
- Intelligent caching with TanStack Query
- Real-time data updates via event subscriptions
- Rate limiting and request batching
- Error recovery and retry mechanisms

## 📝 Instructions

### Step 1: Create BlockchainProvider with Fallback Logic

Implement a provider that manages multiple RPC endpoints:

```typescript
interface BlockchainProviderConfig {
  primaryRpc: string;
  fallbackRpcs: string[];
  maxRetries: number;
  cacheTime: number;
}

class BlockchainProvider {
  private currentProvider: ethers.providers.JsonRpcProvider;
  private providers: ethers.providers.JsonRpcProvider[];
  
  async fetchWithFallback<T>(
    method: string, 
    params: any[]
  ): Promise<T> {
    // Implement fallback logic
  }
}
```

Key implementation points:
- Rotate through providers on failure
- Track provider health metrics
- Implement exponential backoff for retries
- Cache successful responses

### Step 2: Integrate TanStack Query for Caching

Set up efficient data caching:

```typescript
const useBlockchainQuery = <T>(
  queryKey: any[],
  fetchFn: () => Promise<T>,
  options?: {
    staleTime?: number;
    cacheTime?: number;
    refetchInterval?: number;
  }
) => {
  return useQuery({
    queryKey,
    queryFn: fetchFn,
    staleTime: options?.staleTime || 30000,
    cacheTime: options?.cacheTime || 300000,
    refetchInterval: options?.refetchInterval
  });
};
```

Caching strategies:
- Balance data: 30 second stale time
- Transaction history: 5 minute cache
- Block data: Permanent cache
- Token metadata: 1 hour cache

### Step 3: Implement TransactionHistory Component

Build a component that fetches and displays transactions:

```typescript
interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
}

const useTransactionHistory = (
  address: string,
  options?: {
    limit?: number;
    fromBlock?: number;
  }
) => {
  // Implement transaction fetching
};
```

Features to implement:
- Paginated transaction loading
- Real-time transaction status updates
- Transaction categorization (sent/received)
- Gas fee calculation and display

### Step 4: Create Real-time Balance Updates

Implement balance tracking with subscriptions:

```typescript
const useTokenBalance = (
  tokenAddress: string,
  userAddress: string
) => {
  const [balance, setBalance] = useState<string>('0');
  
  useEffect(() => {
    // Set up event listener for Transfer events
    const filter = {
      address: tokenAddress,
      topics: [
        ethers.utils.id('Transfer(address,address,uint256)'),
        null,
        ethers.utils.hexZeroPad(userAddress, 32)
      ]
    };
    
    // Subscribe to events
    provider.on(filter, handleTransfer);
    
    return () => provider.off(filter, handleTransfer);
  }, [tokenAddress, userAddress]);
  
  return balance;
};
```

### Step 5: Build TokenList with Batch Fetching

Create efficient multi-token balance fetching:

```typescript
const useMultipleTokenBalances = (
  tokens: Token[],
  userAddress: string
) => {
  return useQueries({
    queries: tokens.map(token => ({
      queryKey: ['balance', token.address, userAddress],
      queryFn: () => fetchTokenBalance(token, userAddress),
      staleTime: 30000
    }))
  });
};
```

Optimization techniques:
- Batch RPC calls using multicall
- Implement request deduplication
- Use Web Workers for heavy processing
- Optimize re-render performance

## 💡 Hints

### Provider Fallback Pattern

```typescript
async function fetchWithFallback<T>(
  providers: Provider[],
  method: string,
  params: any[]
): Promise<T> {
  for (const provider of providers) {
    try {
      return await provider.send(method, params);
    } catch (error) {
      console.warn(`Provider failed: ${provider.connection.url}`);
      continue;
    }
  }
  throw new Error('All providers failed');
}
```

### Event Subscription Management

```typescript
class EventManager {
  private subscriptions = new Map();
  
  subscribe(event: string, callback: Function) {
    const id = generateId();
    this.subscriptions.set(id, { event, callback });
    return () => this.unsubscribe(id);
  }
  
  unsubscribe(id: string) {
    this.subscriptions.delete(id);
  }
}
```

### Rate Limiting Implementation

```typescript
class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  
  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }
}
```

## 🎓 Learning Notes

### Performance Optimization

1. **Batch requests**: Use multicall contracts for multiple reads
2. **Cache aggressively**: Most blockchain data is immutable
3. **Use indexes**: Leverage event logs for efficient queries
4. **Implement pagination**: Don't fetch all data at once
5. **Consider archival nodes**: For historical data queries

### Error Handling Strategies

1. **Provider errors**: Automatic fallback to secondary providers
2. **Rate limiting**: Implement exponential backoff
3. **Network issues**: Queue requests for retry
4. **Invalid data**: Validate responses before caching
5. **Stale data**: Implement refresh strategies

### Best Practices

```typescript
// Use proper typing for blockchain data
interface BlockchainResponse<T> {
  data: T;
  blockNumber: number;
  timestamp: number;
}

// Implement request deduplication
const pendingRequests = new Map<string, Promise<any>>();

function dedupedFetch(key: string, fetcher: () => Promise<any>) {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }
  
  const promise = fetcher().finally(() => {
    pendingRequests.delete(key);
  });
  
  pendingRequests.set(key, promise);
  return promise;
}
```

## 🔍 Debugging Tips

1. **Monitor RPC usage**: Track request counts and response times
2. **Log provider switches**: Debug fallback behavior
3. **Check cache hits**: Ensure caching works as expected
4. **Verify event filters**: Test subscription accuracy
5. **Profile performance**: Use React DevTools Profiler

## ✅ Checklist

Before submitting your solution, ensure:

- [ ] Multiple RPC providers are configured
- [ ] Fallback mechanism works correctly
- [ ] Data is properly cached with TanStack Query
- [ ] Real-time updates work via events
- [ ] Rate limiting is implemented
- [ ] Error recovery is robust
- [ ] Loading states are shown
- [ ] TypeScript types are comprehensive
- [ ] Performance is optimized
- [ ] Memory leaks are prevented

## 🚀 Extensions

Once you've completed the basic requirements, try:

1. **GraphQL Integration**: Use The Graph for complex queries
2. **WebSocket Support**: Implement WebSocket subscriptions
3. **Archive Node Integration**: Add support for historical queries
4. **Analytics Dashboard**: Build RPC usage analytics
5. **Custom Indexer**: Create your own event indexing system

## 📚 Resources

- [Alchemy Documentation](https://docs.alchemy.com/)
- [Infura API Reference](https://docs.infura.io/)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [ethers.js Providers](https://docs.ethers.io/v5/api/providers/)
- [Multicall Contract](https://github.com/makerdao/multicall)