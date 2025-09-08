# Exercise 01: Web3 Wallet Integration

## 🎯 Learning Objectives

By the end of this exercise, you will be able to:

1. **Implement wallet connection patterns** with MetaMask and WalletConnect
2. **Manage wallet connection state** and persistence across sessions
3. **Handle multiple wallet providers** and wallet switching
4. **Implement secure authentication** patterns with signatures
5. **Create user-friendly wallet connection** interfaces

## 📋 Pre-requisites

Before starting this exercise, you should understand:

- React Context API and hooks
- Basic Web3 concepts (wallets, addresses, networks)
- Async/await patterns and error handling
- Browser storage APIs (localStorage)
- TypeScript for type-safe Web3 integration

## 📚 Introduction

Web3 wallet integration is the foundation of any blockchain-based application. This exercise teaches you to implement production-ready wallet connection patterns that support multiple providers, handle errors gracefully, and provide excellent user experience.

## 🛠️ Setup

You'll implement several components for comprehensive wallet integration:

### Core Components

1. **WalletProvider**: Context provider managing wallet state
2. **ConnectionManager**: Handles connection logic and provider detection
3. **WalletModal**: User interface for wallet selection
4. **AccountDisplay**: Shows connected account information

### Key Features

- Multiple wallet support (MetaMask, WalletConnect, Coinbase Wallet)
- Automatic reconnection on page refresh
- Network switching and validation
- Transaction signing capabilities
- Error handling and recovery

## 📝 Instructions

### Step 1: Implement WalletProvider Context

Create a context provider that manages wallet connection state:

```typescript
interface WalletContextValue {
  account: string | null;
  chainId: number | null;
  provider: any | null;
  isConnecting: boolean;
  error: Error | null;
  connect: (walletType: WalletType) => Promise<void>;
  disconnect: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
  signMessage: (message: string) => Promise<string>;
}
```

Key implementation points:
- Store connection state in context
- Persist connection preferences in localStorage
- Handle provider events (accountsChanged, chainChanged)
- Implement cleanup on disconnect

### Step 2: Create ConnectionManager Component

Build a connection manager that handles different wallet types:

```typescript
interface ConnectionManagerProps {
  supportedWallets: WalletType[];
  requiredChainId?: number;
  onConnect?: (account: string) => void;
  onDisconnect?: () => void;
}
```

Features to implement:
- Detect available wallets in browser
- Handle wallet-specific connection flows
- Validate network on connection
- Auto-switch to required network if needed

### Step 3: Build WalletModal Component

Create a modal for wallet selection:

```typescript
interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (wallet: WalletType) => void;
  availableWallets: WalletInfo[];
}
```

Design considerations:
- Show wallet icons and names
- Indicate which wallets are installed
- Display connection status
- Handle connection errors gracefully

### Step 4: Implement AccountDisplay Component

Display connected account information:

```typescript
interface AccountDisplayProps {
  account: string;
  balance?: string;
  network?: string;
  ensName?: string;
}
```

Features:
- Format address display (0x1234...5678)
- Show ETH balance
- Display network name and status
- Support ENS name resolution

## 💡 Hints

### Wallet Detection

```typescript
const detectWallets = () => {
  const wallets = [];
  
  if (typeof window.ethereum !== 'undefined') {
    if (window.ethereum.isMetaMask) {
      wallets.push({ type: 'metamask', name: 'MetaMask' });
    }
  }
  
  // Add more wallet detection logic
  return wallets;
};
```

### Connection Persistence

```typescript
useEffect(() => {
  const savedWallet = localStorage.getItem('connectedWallet');
  if (savedWallet) {
    // Attempt to reconnect
    reconnectWallet(savedWallet);
  }
}, []);
```

### Network Validation

```typescript
const validateNetwork = async (requiredChainId: number) => {
  const currentChainId = await provider.request({ 
    method: 'eth_chainId' 
  });
  
  if (parseInt(currentChainId, 16) !== requiredChainId) {
    await switchNetwork(requiredChainId);
  }
};
```

## 🎓 Learning Notes

### Security Considerations

1. **Never store private keys** in your application
2. **Validate all signatures** on the backend
3. **Use checksummed addresses** for display
4. **Implement request throttling** for RPC calls
5. **Handle wallet disconnection** gracefully

### Best Practices

1. **Provider abstraction**: Don't tie your app to specific wallet implementations
2. **Error messages**: Provide clear, actionable error messages
3. **Loading states**: Show connection progress to users
4. **Mobile support**: Consider mobile wallet connections
5. **Testing**: Use test networks during development

### Common Patterns

```typescript
// Singleton provider pattern
let provider: ethers.providers.Web3Provider | null = null;

export const getProvider = () => {
  if (!provider && window.ethereum) {
    provider = new ethers.providers.Web3Provider(window.ethereum);
  }
  return provider;
};

// Connection state machine
type ConnectionState = 
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';
```

## 🔍 Debugging Tips

1. **Check browser console** for wallet provider errors
2. **Verify network ID** matches expected chain
3. **Test with multiple wallets** to ensure compatibility
4. **Monitor gas prices** for transaction issues
5. **Use event listeners** for debugging state changes

## ✅ Checklist

Before submitting your solution, ensure:

- [ ] Multiple wallet types are supported
- [ ] Connection persists across page refreshes
- [ ] Network switching works correctly
- [ ] Error messages are user-friendly
- [ ] Loading states are implemented
- [ ] Account display formats correctly
- [ ] Disconnect functionality works
- [ ] TypeScript types are comprehensive
- [ ] Event listeners are cleaned up
- [ ] Security best practices are followed

## 🚀 Extensions

Once you've completed the basic requirements, try:

1. **ENS Integration**: Resolve and display ENS names
2. **Multi-chain Support**: Handle multiple blockchain networks
3. **Hardware Wallets**: Add Ledger/Trezor support
4. **Session Management**: Implement timeout and re-authentication
5. **Analytics**: Track wallet connection metrics

## 📚 Resources

- [ethers.js Documentation](https://docs.ethers.io/)
- [WalletConnect Docs](https://docs.walletconnect.com/)
- [MetaMask Provider API](https://docs.metamask.io/guide/ethereum-provider.html)
- [EIP-1193: Ethereum Provider JavaScript API](https://eips.ethereum.org/EIPS/eip-1193)
- [Web3Modal Library](https://github.com/Web3Modal/web3modal)