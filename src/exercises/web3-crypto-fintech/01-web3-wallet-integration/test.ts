import { TestResult } from '../../../types/test';

export function runTests(userCode: string): TestResult[] {
  const results: TestResult[] = [];
  const startTime = Date.now();

  try {
    // Test 1: Check if WalletProvider is exported
    results.push({
      name: 'WalletProvider component is exported',
      passed: userCode.includes('export') && 
              userCode.includes('WalletProvider') &&
              userCode.includes('React.FC'),
      error: userCode.includes('export') && userCode.includes('WalletProvider') 
        ? undefined 
        : 'WalletProvider component must be exported',
      executionTime: Date.now() - startTime
    });

    // Test 2: Check if useWallet hook is implemented
    results.push({
      name: 'useWallet hook is implemented',
      passed: userCode.includes('useWallet') && 
              userCode.includes('useContext') &&
              userCode.includes('WalletContext'),
      error: userCode.includes('useWallet') 
        ? undefined 
        : 'useWallet hook must be implemented with useContext',
      executionTime: Date.now() - startTime
    });

    // Test 3: Check if ConnectionManager is implemented
    results.push({
      name: 'ConnectionManager component exists',
      passed: userCode.includes('ConnectionManager') &&
              userCode.includes('supportedWallets') &&
              userCode.includes('requiredChainId'),
      error: userCode.includes('ConnectionManager')
        ? undefined
        : 'ConnectionManager component must be implemented with wallet support',
      executionTime: Date.now() - startTime
    });

    // Test 4: Check wallet connection logic
    results.push({
      name: 'Wallet connection logic implemented',
      passed: userCode.includes('eth_requestAccounts') &&
              userCode.includes('eth_chainId') &&
              userCode.includes('window.ethereum'),
      error: userCode.includes('eth_requestAccounts')
        ? undefined
        : 'Must implement wallet connection with eth_requestAccounts',
      executionTime: Date.now() - startTime
    });

    // Test 5: Check for event listeners
    results.push({
      name: 'Wallet event listeners implemented',
      passed: userCode.includes('accountsChanged') &&
              userCode.includes('chainChanged') &&
              (userCode.includes('.on(') || userCode.includes('addEventListener')),
      error: userCode.includes('accountsChanged')
        ? undefined
        : 'Must implement accountsChanged and chainChanged event listeners',
      executionTime: Date.now() - startTime
    });

    // Test 6: Check for disconnect functionality
    results.push({
      name: 'Disconnect functionality implemented',
      passed: userCode.includes('disconnect') &&
              userCode.includes('localStorage.removeItem') &&
              userCode.includes('setAccount(null)'),
      error: userCode.includes('disconnect')
        ? undefined
        : 'Must implement disconnect functionality with state cleanup',
      executionTime: Date.now() - startTime
    });

    // Test 7: Check for network switching
    results.push({
      name: 'Network switching implemented',
      passed: userCode.includes('switchNetwork') &&
              userCode.includes('wallet_switchEthereumChain') &&
              userCode.includes('chainId'),
      error: userCode.includes('wallet_switchEthereumChain')
        ? undefined
        : 'Must implement network switching with wallet_switchEthereumChain',
      executionTime: Date.now() - startTime
    });

    // Test 8: Check for message signing
    results.push({
      name: 'Message signing functionality',
      passed: userCode.includes('signMessage') &&
              userCode.includes('personal_sign') &&
              userCode.includes('signature'),
      error: userCode.includes('personal_sign')
        ? undefined
        : 'Must implement message signing with personal_sign',
      executionTime: Date.now() - startTime
    });

    // Test 9: Check for WalletModal component
    results.push({
      name: 'WalletModal component implemented',
      passed: userCode.includes('WalletModal') &&
              userCode.includes('Modal') &&
              userCode.includes('availableWallets'),
      error: userCode.includes('WalletModal')
        ? undefined
        : 'WalletModal component must be implemented with wallet selection',
      executionTime: Date.now() - startTime
    });

    // Test 10: Check for AccountDisplay component
    results.push({
      name: 'AccountDisplay component implemented',
      passed: userCode.includes('AccountDisplay') &&
              userCode.includes('formatAddress') &&
              userCode.includes('balance'),
      error: userCode.includes('AccountDisplay')
        ? undefined
        : 'AccountDisplay component must show formatted address and balance',
      executionTime: Date.now() - startTime
    });

    // Test 11: Check for localStorage persistence
    results.push({
      name: 'Connection persistence with localStorage',
      passed: userCode.includes('localStorage.setItem') &&
              userCode.includes('localStorage.getItem') &&
              userCode.includes('connectedWallet'),
      error: userCode.includes('localStorage.setItem')
        ? undefined
        : 'Must persist wallet connection in localStorage',
      executionTime: Date.now() - startTime
    });

    // Test 12: Check for error handling
    results.push({
      name: 'Error handling implemented',
      passed: userCode.includes('try') &&
              userCode.includes('catch') &&
              userCode.includes('setError'),
      error: userCode.includes('setError')
        ? undefined
        : 'Must implement proper error handling with try/catch',
      executionTime: Date.now() - startTime
    });

    // Test 13: Check for loading states
    results.push({
      name: 'Loading states implemented',
      passed: userCode.includes('isConnecting') &&
              userCode.includes('setIsConnecting(true)') &&
              userCode.includes('setIsConnecting(false)'),
      error: userCode.includes('isConnecting')
        ? undefined
        : 'Must implement loading states during connection',
      executionTime: Date.now() - startTime
    });

    // Test 14: Check for multiple wallet support
    results.push({
      name: 'Multiple wallet types supported',
      passed: userCode.includes('metamask') &&
              userCode.includes('coinbase') &&
              userCode.includes('WalletType'),
      error: userCode.includes('WalletType')
        ? undefined
        : 'Must support multiple wallet types (MetaMask, Coinbase, etc.)',
      executionTime: Date.now() - startTime
    });

    // Test 15: Check for balance fetching
    results.push({
      name: 'Balance fetching implemented',
      passed: userCode.includes('eth_getBalance') &&
              userCode.includes('balance') &&
              userCode.includes('toFixed'),
      error: userCode.includes('eth_getBalance')
        ? undefined
        : 'Must fetch and display wallet balance',
      executionTime: Date.now() - startTime
    });

    // Test 16: Check for network name display
    results.push({
      name: 'Network name display implemented',
      passed: userCode.includes('getNetworkName') &&
              userCode.includes('chainId') &&
              (userCode.includes('Ethereum') || userCode.includes('Polygon')),
      error: userCode.includes('getNetworkName')
        ? undefined
        : 'Must display network name based on chain ID',
      executionTime: Date.now() - startTime
    });

    // Test 17: Check for auto-reconnect
    results.push({
      name: 'Auto-reconnect on mount',
      passed: userCode.includes('useEffect') &&
              userCode.includes('savedWallet') &&
              userCode.includes('reconnect'),
      error: userCode.includes('savedWallet')
        ? undefined
        : 'Must implement auto-reconnect on component mount',
      executionTime: Date.now() - startTime
    });

    // Test 18: Check for TypeScript interfaces
    results.push({
      name: 'TypeScript interfaces defined',
      passed: userCode.includes('interface WalletContextValue') &&
              userCode.includes('interface WalletInfo') &&
              userCode.includes('interface ConnectionManagerProps'),
      error: userCode.includes('interface WalletContextValue')
        ? undefined
        : 'Must define TypeScript interfaces for type safety',
      executionTime: Date.now() - startTime
    });

    // Test 19: Check for cleanup on unmount
    results.push({
      name: 'Event listener cleanup on unmount',
      passed: userCode.includes('return () =>') &&
              (userCode.includes('removeListener') || userCode.includes('.off(')),
      error: userCode.includes('return () =>')
        ? undefined
        : 'Must clean up event listeners on component unmount',
      executionTime: Date.now() - startTime
    });

    // Test 20: Check for NO TODOs remaining
    results.push({
      name: 'All TODOs completed',
      passed: !userCode.includes('TODO'),
      error: !userCode.includes('TODO')
        ? undefined
        : 'Must complete all TODO items in the exercise',
      executionTime: Date.now() - startTime
    });

  } catch (error) {
    results.push({
      name: 'Code execution',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      executionTime: Date.now() - startTime
    });
  }

  return results;
}