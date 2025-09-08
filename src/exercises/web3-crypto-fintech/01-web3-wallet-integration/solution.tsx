import * as React from 'react';
import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';
import { Card, Button, Group, Stack, Text, Badge, Modal, Avatar, CopyButton, Loader, Alert } from '@mantine/core';
import { IconWallet, IconPlugConnected, IconPlugOff, IconCopy, IconCheck, IconAlertCircle, IconNetwork } from '@tabler/icons-react';

// === TYPES AND INTERFACES ===

type WalletType = 'metamask' | 'walletconnect' | 'coinbase' | 'phantom';

interface WalletInfo {
  type: WalletType;
  name: string;
  icon: string;
  installed: boolean;
}

interface WalletContextValue {
  account: string | null;
  chainId: number | null;
  provider: any | null;
  balance: string | null;
  isConnecting: boolean;
  error: Error | null;
  connect: (walletType: WalletType) => Promise<void>;
  disconnect: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
  signMessage: (message: string) => Promise<string>;
}

// === WALLET PROVIDER CONTEXT ===

const WalletContext = createContext<WalletContextValue | null>(null);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<any | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const providerRef = useRef<any>(null);

  // Detect and connect to wallet
  const connect = useCallback(async (walletType: WalletType) => {
    setIsConnecting(true);
    setError(null);

    try {
      let walletProvider: any;

      switch (walletType) {
        case 'metamask':
          if (typeof window.ethereum === 'undefined') {
            throw new Error('MetaMask is not installed');
          }
          walletProvider = window.ethereum;
          break;
        
        case 'coinbase':
          // Coinbase Wallet detection
          if (window.ethereum?.isCoinbaseWallet) {
            walletProvider = window.ethereum;
          } else {
            throw new Error('Coinbase Wallet is not installed');
          }
          break;

        case 'walletconnect':
          // WalletConnect would require additional setup with WalletConnect provider
          throw new Error('WalletConnect integration requires additional setup');

        case 'phantom':
          if (!window.solana?.isPhantom) {
            throw new Error('Phantom wallet is not installed');
          }
          walletProvider = window.solana;
          break;

        default:
          throw new Error('Unsupported wallet type');
      }

      // Request account access
      const accounts = await walletProvider.request({ 
        method: 'eth_requestAccounts' 
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Get chain ID
      const chainIdHex = await walletProvider.request({ 
        method: 'eth_chainId' 
      });
      const currentChainId = parseInt(chainIdHex, 16);

      // Get balance
      const balanceWei = await walletProvider.request({
        method: 'eth_getBalance',
        params: [accounts[0], 'latest']
      });
      const balanceEth = (parseInt(balanceWei, 16) / 1e18).toFixed(4);

      // Set state
      setAccount(accounts[0]);
      setChainId(currentChainId);
      setProvider(walletProvider);
      setBalance(balanceEth);
      providerRef.current = walletProvider;

      // Save connection preference
      localStorage.setItem('connectedWallet', walletType);
      localStorage.setItem('connectedAccount', accounts[0]);

      // Setup event listeners
      setupEventListeners(walletProvider);

    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to connect wallet'));
      console.error('Wallet connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setAccount(null);
    setChainId(null);
    setProvider(null);
    setBalance(null);
    setError(null);
    
    // Clear saved connection
    localStorage.removeItem('connectedWallet');
    localStorage.removeItem('connectedAccount');

    // Remove event listeners
    if (providerRef.current) {
      removeEventListeners(providerRef.current);
      providerRef.current = null;
    }
  }, []);

  // Switch network
  const switchNetwork = useCallback(async (targetChainId: number) => {
    if (!provider) {
      throw new Error('No wallet connected');
    }

    try {
      const chainIdHex = `0x${targetChainId.toString(16)}`;
      
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }]
      });

      setChainId(targetChainId);
    } catch (err: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (err.code === 4902) {
        // Handle adding the network
        throw new Error('Network not added to wallet. Please add it manually.');
      }
      throw err;
    }
  }, [provider]);

  // Sign message
  const signMessage = useCallback(async (message: string): Promise<string> => {
    if (!provider || !account) {
      throw new Error('No wallet connected');
    }

    try {
      const signature = await provider.request({
        method: 'personal_sign',
        params: [message, account]
      });
      
      return signature;
    } catch (err) {
      console.error('Message signing error:', err);
      throw err;
    }
  }, [provider, account]);

  // Setup event listeners
  const setupEventListeners = useCallback((walletProvider: any) => {
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAccount(accounts[0]);
        // Update balance for new account
        updateBalance(walletProvider, accounts[0]);
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      const newChainId = parseInt(chainIdHex, 16);
      setChainId(newChainId);
      window.location.reload(); // Recommended by MetaMask
    };

    walletProvider.on('accountsChanged', handleAccountsChanged);
    walletProvider.on('chainChanged', handleChainChanged);

    return () => {
      walletProvider.removeListener('accountsChanged', handleAccountsChanged);
      walletProvider.removeListener('chainChanged', handleChainChanged);
    };
  }, [disconnect]);

  // Remove event listeners
  const removeEventListeners = useCallback((walletProvider: any) => {
    walletProvider.removeAllListeners('accountsChanged');
    walletProvider.removeAllListeners('chainChanged');
  }, []);

  // Update balance
  const updateBalance = useCallback(async (walletProvider: any, accountAddress: string) => {
    try {
      const balanceWei = await walletProvider.request({
        method: 'eth_getBalance',
        params: [accountAddress, 'latest']
      });
      const balanceEth = (parseInt(balanceWei, 16) / 1e18).toFixed(4);
      setBalance(balanceEth);
    } catch (err) {
      console.error('Failed to update balance:', err);
    }
  }, []);

  // Auto-reconnect on mount
  useEffect(() => {
    const savedWallet = localStorage.getItem('connectedWallet');
    const savedAccount = localStorage.getItem('connectedAccount');

    if (savedWallet && savedAccount) {
      // Attempt to reconnect
      connect(savedWallet as WalletType).catch(err => {
        console.error('Auto-reconnect failed:', err);
        localStorage.removeItem('connectedWallet');
        localStorage.removeItem('connectedAccount');
      });
    }
  }, [connect]);

  // Periodically update balance
  useEffect(() => {
    if (!provider || !account) return;

    const interval = setInterval(() => {
      updateBalance(provider, account);
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [provider, account, updateBalance]);

  return (
    <WalletContext.Provider value={{
      account,
      chainId,
      provider,
      balance,
      isConnecting,
      error,
      connect,
      disconnect,
      switchNetwork,
      signMessage
    }}>
      {children}
    </WalletContext.Provider>
  );
};

// === CONNECTION MANAGER COMPONENT ===

interface ConnectionManagerProps {
  supportedWallets?: WalletType[];
  requiredChainId?: number;
  onConnect?: (account: string) => void;
  onDisconnect?: () => void;
}

export const ConnectionManager: React.FC<ConnectionManagerProps> = ({
  supportedWallets = ['metamask', 'coinbase'],
  requiredChainId,
  onConnect,
  onDisconnect
}) => {
  const wallet = useWallet();
  const [showModal, setShowModal] = useState(false);
  const [availableWallets, setAvailableWallets] = useState<WalletInfo[]>([]);

  // Detect available wallets
  useEffect(() => {
    const detectWallets = () => {
      const wallets: WalletInfo[] = [];

      // Check MetaMask
      if (supportedWallets.includes('metamask')) {
        wallets.push({
          type: 'metamask',
          name: 'MetaMask',
          icon: '🦊',
          installed: typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask === true
        });
      }

      // Check Coinbase
      if (supportedWallets.includes('coinbase')) {
        wallets.push({
          type: 'coinbase',
          name: 'Coinbase Wallet',
          icon: '💰',
          installed: typeof window.ethereum !== 'undefined' && window.ethereum.isCoinbaseWallet === true
        });
      }

      // WalletConnect is always available
      if (supportedWallets.includes('walletconnect')) {
        wallets.push({
          type: 'walletconnect',
          name: 'WalletConnect',
          icon: '🔗',
          installed: true
        });
      }

      setAvailableWallets(wallets);
    };

    detectWallets();
  }, [supportedWallets]);

  // Handle wallet selection
  const handleWalletSelect = async (walletType: WalletType) => {
    try {
      await wallet.connect(walletType);
      setShowModal(false);
      
      if (wallet.account && onConnect) {
        onConnect(wallet.account);
      }

      // Check required chain
      if (requiredChainId && wallet.chainId !== requiredChainId) {
        await wallet.switchNetwork(requiredChainId);
      }
    } catch (err) {
      console.error('Connection failed:', err);
    }
  };

  // Handle disconnect
  const handleDisconnect = () => {
    wallet.disconnect();
    if (onDisconnect) {
      onDisconnect();
    }
  };

  return (
    <>
      <Card shadow="sm" p="lg">
        <Stack>
          <Group justify="space-between">
            <Text fw={500}>Wallet Connection</Text>
            {wallet.account && (
              <Badge color="green" variant="dot">
                Connected
              </Badge>
            )}
          </Group>

          {!wallet.account ? (
            <Button
              leftSection={<IconWallet size={20} />}
              onClick={() => setShowModal(true)}
              loading={wallet.isConnecting}
              fullWidth
            >
              Connect Wallet
            </Button>
          ) : (
            <Stack>
              <AccountDisplay
                account={wallet.account}
                balance={wallet.balance}
                chainId={wallet.chainId}
              />
              <Button
                variant="light"
                color="red"
                leftSection={<IconPlugOff size={20} />}
                onClick={handleDisconnect}
                fullWidth
              >
                Disconnect
              </Button>
            </Stack>
          )}

          {wallet.error && (
            <Alert color="red" icon={<IconAlertCircle />}>
              {wallet.error.message}
            </Alert>
          )}
        </Stack>
      </Card>

      <WalletModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSelect={handleWalletSelect}
        availableWallets={availableWallets}
        isConnecting={wallet.isConnecting}
      />
    </>
  );
};

// === WALLET MODAL COMPONENT ===

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (wallet: WalletType) => void;
  availableWallets: WalletInfo[];
  isConnecting: boolean;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  availableWallets,
  isConnecting
}) => {
  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title="Connect Wallet"
      size="md"
    >
      <Stack>
        {availableWallets.map((wallet) => (
          <Button
            key={wallet.type}
            variant={wallet.installed ? 'light' : 'outline'}
            onClick={() => onSelect(wallet.type)}
            disabled={!wallet.installed || isConnecting}
            leftSection={<Text size="xl">{wallet.icon}</Text>}
            rightSection={
              !wallet.installed && (
                <Badge color="gray" size="sm">
                  Not Installed
                </Badge>
              )
            }
            fullWidth
            size="lg"
          >
            {wallet.name}
          </Button>
        ))}

        {isConnecting && (
          <Group justify="center" mt="md">
            <Loader size="sm" />
            <Text size="sm" c="dimmed">Connecting...</Text>
          </Group>
        )}
      </Stack>
    </Modal>
  );
};

// === ACCOUNT DISPLAY COMPONENT ===

interface AccountDisplayProps {
  account: string;
  balance?: string | null;
  chainId?: number | null;
  ensName?: string;
}

export const AccountDisplay: React.FC<AccountDisplayProps> = ({
  account,
  balance,
  chainId,
  ensName
}) => {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getNetworkName = (id: number | null) => {
    if (!id) return 'Unknown';
    const networks: Record<number, string> = {
      1: 'Ethereum',
      5: 'Goerli',
      11155111: 'Sepolia',
      137: 'Polygon',
      80001: 'Mumbai',
      42161: 'Arbitrum',
      10: 'Optimism'
    };
    return networks[id] || `Chain ID: ${id}`;
  };

  return (
    <Card withBorder p="sm">
      <Stack gap="xs">
        <Group justify="space-between">
          <Group gap="xs">
            <Avatar size="sm" color="blue">
              <IconWallet size={16} />
            </Avatar>
            <Text size="sm" fw={500}>
              {ensName || formatAddress(account)}
            </Text>
          </Group>
          <CopyButton value={account}>
            {({ copied, copy }) => (
              <Button
                size="xs"
                variant="subtle"
                onClick={copy}
                leftSection={copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            )}
          </CopyButton>
        </Group>

        {balance && (
          <Group justify="space-between">
            <Text size="xs" c="dimmed">Balance</Text>
            <Text size="sm" fw={500}>{balance} ETH</Text>
          </Group>
        )}

        {chainId && (
          <Group justify="space-between">
            <Text size="xs" c="dimmed">Network</Text>
            <Badge size="sm" leftSection={<IconNetwork size={12} />}>
              {getNetworkName(chainId)}
            </Badge>
          </Group>
        )}
      </Stack>
    </Card>
  );
};

// === MAIN COMPONENT ===

export default function Web3WalletIntegration() {
  const [signatureResult, setSignatureResult] = useState<string | null>(null);

  const handleConnect = (account: string) => {
    console.log('Connected:', account);
  };

  const handleDisconnect = () => {
    console.log('Disconnected');
    setSignatureResult(null);
  };

  const handleSignMessage = async () => {
    const wallet = useWallet();
    if (!wallet.account) return;

    try {
      const message = `Sign this message to verify your identity.\nTimestamp: ${new Date().toISOString()}`;
      const signature = await wallet.signMessage(message);
      setSignatureResult(signature);
    } catch (err) {
      console.error('Signing failed:', err);
    }
  };

  return (
    <WalletProvider>
      <Stack gap="lg">
        <Text size="xl" fw={700}>Web3 Wallet Integration</Text>
        
        <ConnectionManager
          supportedWallets={['metamask', 'coinbase']}
          requiredChainId={1}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
        />

        <WalletContext.Consumer>
          {(wallet) => wallet?.account && (
            <Card shadow="sm" p="lg">
              <Stack>
                <Text fw={500}>Test Wallet Features</Text>
                
                <Button onClick={handleSignMessage}>
                  Sign Test Message
                </Button>

                {signatureResult && (
                  <Alert color="green" title="Message Signed">
                    <Text size="xs" style={{ wordBreak: 'break-all' }}>
                      {signatureResult}
                    </Text>
                  </Alert>
                )}

                <Button
                  variant="light"
                  onClick={() => wallet.switchNetwork(5)}
                  disabled={wallet.chainId === 5}
                >
                  Switch to Goerli
                </Button>
              </Stack>
            </Card>
          )}
        </WalletContext.Consumer>
      </Stack>
    </WalletProvider>
  );
}