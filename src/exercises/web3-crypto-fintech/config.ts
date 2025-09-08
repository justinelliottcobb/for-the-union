import type { ExerciseCategory } from '@/types';

export const web3CryptoFintechCategory: ExerciseCategory = {
  id: 'web3-crypto-fintech',
  name: 'Web3 & Crypto Fintech',
  description: 'Master blockchain integration patterns essential for Staff Frontend Engineers building cryptocurrency, DeFi, and fintech applications',
  icon: 'IconBrandEthereum',
  order: 12,
  exercises: [
    {
      id: '01-web3-wallet-integration',
      title: 'Web3 Wallet Integration',
      description: 'Master Web3 wallet integration patterns for production React applications with multiple wallet support and secure authentication',
      category: 'web3-crypto-fintech',
      difficulty: 3,
      prerequisites: [],
      learningObjectives: [
        'Implement wallet connection patterns with MetaMask and WalletConnect',
        'Manage wallet connection state and persistence across sessions',
        'Handle multiple wallet providers and seamless wallet switching',
        'Implement secure authentication patterns with message signatures',
        'Create user-friendly wallet connection interfaces with error handling'
      ],
      hints: [
        'Focus on creating a provider-agnostic wallet connection system',
        'Use localStorage for connection persistence and auto-reconnection',
        'Implement proper event listeners for account and network changes',
        'Add security validations for all wallet interactions',
        'Create fallback mechanisms for unsupported wallet features'
      ],
      estimatedTime: 60,
      filePath: './exercise-files/web3-crypto-fintech/01-web3-wallet-integration/exercise.tsx',
      solutionPath: './src/exercises/web3-crypto-fintech/01-web3-wallet-integration/solution.tsx',
      testsPath: './src/exercises/web3-crypto-fintech/01-web3-wallet-integration/test.ts',
      instructionsPath: './src/exercises/web3-crypto-fintech/01-web3-wallet-integration/instructions.md',
    },
    {
      id: '02-blockchain-data-fetching',
      title: 'Blockchain Data Fetching',
      description: 'Learn advanced patterns for fetching blockchain data with RPC provider integration, intelligent caching, and real-time updates',
      category: 'web3-crypto-fintech',
      difficulty: 4,
      prerequisites: ['01-web3-wallet-integration'],
      learningObjectives: [
        'Implement efficient blockchain data fetching patterns with provider fallbacks',
        'Integrate with professional RPC providers like Alchemy and Infura',
        'Cache blockchain data strategically with TanStack Query optimization',
        'Handle real-time blockchain updates through event subscriptions',
        'Implement robust error recovery and rate limiting mechanisms'
      ],
      hints: [
        'Use TanStack Query for intelligent blockchain data caching',
        'Implement automatic provider fallback for reliability',
        'Set different cache times for various data types (blocks vs balances)',
        'Use event subscriptions for real-time balance and transaction updates',
        'Add request batching and deduplication for performance'
      ],
      estimatedTime: 75,
      filePath: './exercise-files/web3-crypto-fintech/02-blockchain-data-fetching/exercise.tsx',
      solutionPath: './src/exercises/web3-crypto-fintech/02-blockchain-data-fetching/solution.tsx',
      testsPath: './src/exercises/web3-crypto-fintech/02-blockchain-data-fetching/test.ts',
      instructionsPath: './src/exercises/web3-crypto-fintech/02-blockchain-data-fetching/instructions.md',
    },
    {
      id: '03-smart-contract-interaction',
      title: 'Smart Contract Interaction',
      description: 'Master smart contract integration with transaction lifecycle management, gas optimization, and type-safe contract interfaces',
      category: 'web3-crypto-fintech',
      difficulty: 4,
      prerequisites: ['02-blockchain-data-fetching'],
      learningObjectives: [
        'Integrate smart contracts with React using ethers.js and TypeChain',
        'Implement complete transaction lifecycle management with status tracking',
        'Handle contract events and real-time updates efficiently',
        'Optimize gas estimation and implement EIP-1559 pricing strategies',
        'Generate TypeScript types from contract ABIs for type safety'
      ],
      hints: [
        'Create a contract abstraction layer for reusable patterns',
        'Use TypeChain for automatic type generation from ABIs',
        'Implement transaction queuing with status updates',
        'Add gas estimation buffers and EIP-1559 support',
        'Set up event filtering for relevant contract interactions'
      ],
      estimatedTime: 75,
      filePath: './exercise-files/web3-crypto-fintech/03-smart-contract-interaction/exercise.tsx',
      solutionPath: './src/exercises/web3-crypto-fintech/03-smart-contract-interaction/solution.tsx',
      testsPath: './src/exercises/web3-crypto-fintech/03-smart-contract-interaction/test.ts',
      instructionsPath: './src/exercises/web3-crypto-fintech/03-smart-contract-interaction/instructions.md',
    }
  ]
};