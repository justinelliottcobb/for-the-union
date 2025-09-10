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

  // TODO: Implement wallet connection logic
  const connect = useCallback(async (walletType: WalletType) => {
    setIsConnecting(true);
    setError(null);

    try {
      // TODO: Detect and connect to the specified wallet type
      // Hint: Use window.ethereum for MetaMask
      // Request accounts using eth_requestAccounts
      // Get chain ID using eth_chainId
      // Get balance using eth_getBalance
      // Save connection preference to localStorage
      // Setup event listeners for account and chain changes
      
      console.log('Connecting to wallet:', walletType);
      
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to connect wallet'));
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // TODO: Implement wallet disconnection
  const disconnect = useCallback(() => {
    // TODO: Clear all wallet state
    // Remove from localStorage
    // Remove event listeners
    
    console.log('Disconnecting wallet');
  }, []);

  // TODO: Implement network switching
  const switchNetwork = useCallback(async (targetChainId: number) => {
    if (!provider) {
      throw new Error('No wallet connected');
    }

    // TODO: Use wallet_switchEthereumChain to switch networks
    // Handle errors for networks not added to wallet
    
    console.log('Switching to network:', targetChainId);
  }, [provider]);

  // TODO: Implement message signing
  const signMessage = useCallback(async (message: string): Promise<string> => {
    if (!provider || !account) {
      throw new Error('No wallet connected');
    }

    // TODO: Use personal_sign to sign messages
    
    console.log('Signing message:', message);
    return '';
  }, [provider, account]);

  // TODO: Setup event listeners for wallet events
  const setupEventListeners = useCallback((walletProvider: any) => {
    // TODO: Listen for accountsChanged event
    // TODO: Listen for chainChanged event
    // Update state when events fire
    // Return cleanup function
    
    console.log('Setting up event listeners');
  }, []);

  // TODO: Implement auto-reconnect on mount
  useEffect(() => {
    // TODO: Check localStorage for saved wallet connection
    // Attempt to reconnect if found
    
    console.log('Checking for saved connection');
  }, []);

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

  // TODO: Detect available wallets
  useEffect(() => {
    const detectWallets = () => {
      const wallets: WalletInfo[] = [];

      // TODO: Check for MetaMask installation
      // TODO: Check for Coinbase Wallet installation
      // TODO: Add other wallet detections
      
      setAvailableWallets(wallets);
    };

    detectWallets();
  }, [supportedWallets]);

  // TODO: Handle wallet selection
  const handleWalletSelect = async (walletType: WalletType) => {
    // TODO: Connect to selected wallet
    // Close modal on success
    // Check and switch to required chain if needed
    
    console.log('Selected wallet:', walletType);
  };

  // TODO: Handle disconnect
  const handleDisconnect = () => {
    // TODO: Call wallet disconnect
    // Trigger onDisconnect callback
    
    console.log('Disconnecting');
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
  // TODO: Implement wallet selection modal
  // Show available wallets
  // Indicate which are installed
  // Handle wallet selection
  
  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title="Connect Wallet"
      size="md"
    >
      <Stack>
        {/* TODO: Display wallet options */}
        <Text>Wallet selection UI to be implemented</Text>
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
  // TODO: Format address for display (0x1234...5678)
  const formatAddress = (address: string) => {
    return address; // TODO: Implement proper formatting
  };

  // TODO: Get network name from chain ID
  const getNetworkName = (id: number | null) => {
    if (!id) return 'Unknown';
    // TODO: Map chain IDs to network names
    return 'Network';
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
          {/* TODO: Implement copy button functionality */}
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

  // TODO: Implement message signing test
  const handleSignMessage = async () => {
    console.log('Sign message clicked');
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

        {/* TODO: Add wallet feature testing UI */}
      </Stack>
    </WalletProvider>
  );
}