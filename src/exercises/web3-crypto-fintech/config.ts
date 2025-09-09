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
    },
    {
      id: '04-defi-protocol-integration',
      title: 'DeFi Protocol Integration',
      description: 'Build advanced DeFi protocol integration with multi-DEX routing, liquidity provisioning, and yield farming strategies',
      category: 'web3-crypto-fintech',
      difficulty: 5,
      prerequisites: ['03-smart-contract-interaction'],
      learningObjectives: [
        'Integrate multiple DeFi protocols (Uniswap V2/V3, SushiSwap, 1inch) for optimal routing',
        'Implement liquidity provisioning with impermanent loss calculations',
        'Build yield farming strategies with APY tracking and automatic compounding',
        'Handle MEV protection and slippage calculations for production trading',
        'Create advanced price impact analysis and arbitrage detection systems'
      ],
      hints: [
        'Create a protocol router that can compare rates across multiple DEXs',
        'Implement proper slippage protection for all swaps',
        'Add MEV protection using private mempools or flashbots',
        'Calculate impermanent loss accurately for LP positions',
        'Use multicall for efficient batch operations'
      ],
      estimatedTime: 90,
      filePath: './exercise-files/web3-crypto-fintech/04-defi-protocol-integration/exercise.tsx',
      solutionPath: './src/exercises/web3-crypto-fintech/04-defi-protocol-integration/solution.tsx',
      testsPath: './src/exercises/web3-crypto-fintech/04-defi-protocol-integration/test.ts',
      instructionsPath: './src/exercises/web3-crypto-fintech/04-defi-protocol-integration/instructions.md',
    },
    {
      id: '05-trading-interface-patterns',
      title: 'Trading Interface Patterns',
      description: 'Develop professional trading interfaces with real-time data feeds, advanced charting, and sophisticated order management',
      category: 'web3-crypto-fintech',
      difficulty: 5,
      prerequisites: ['04-defi-protocol-integration'],
      learningObjectives: [
        'Build professional trading interfaces with real-time price feeds and advanced charting',
        'Implement order management systems with multiple order types and execution strategies',
        'Create portfolio tracking with P&L calculations and risk metrics',
        'Handle WebSocket connections for real-time market data and order updates',
        'Design risk management tools with position sizing and stop-loss automation'
      ],
      hints: [
        'Use WebSockets for real-time market data updates',
        'Implement efficient chart rendering with canvas or SVG',
        'Add proper order validation and risk checks',
        'Create a modular order management system',
        'Use technical indicators libraries for chart analysis'
      ],
      estimatedTime: 90,
      filePath: './exercise-files/web3-crypto-fintech/05-trading-interface-patterns/exercise.tsx',
      solutionPath: './src/exercises/web3-crypto-fintech/05-trading-interface-patterns/solution.tsx',
      testsPath: './src/exercises/web3-crypto-fintech/05-trading-interface-patterns/test.ts',
      instructionsPath: './src/exercises/web3-crypto-fintech/05-trading-interface-patterns/instructions.md',
    },
    {
      id: '06-nft-marketplace-development',
      title: 'NFT Marketplace Development',
      description: 'Create comprehensive NFT marketplace features with IPFS integration, auction systems, and metadata resolution',
      category: 'web3-crypto-fintech',
      difficulty: 4,
      prerequisites: ['03-smart-contract-interaction'],
      learningObjectives: [
        'Build comprehensive NFT marketplace interfaces with gallery views and detailed NFT displays',
        'Implement NFT minting workflows with IPFS integration and metadata management',
        'Create auction and marketplace systems with bidding, offers, and secondary sales',
        'Handle ERC-721 and ERC-1155 standards for both single and batch NFT operations',
        'Integrate IPFS for decentralized storage with image optimization and metadata resolution'
      ],
      hints: [
        'Use IPFS for decentralized metadata and image storage',
        'Implement proper NFT standard detection (ERC-721 vs ERC-1155)',
        'Add image optimization and lazy loading for large collections',
        'Create efficient metadata caching strategies',
        'Handle auction timing and bid validation carefully'
      ],
      estimatedTime: 75,
      filePath: './exercise-files/web3-crypto-fintech/06-nft-marketplace-development/exercise.tsx',
      solutionPath: './src/exercises/web3-crypto-fintech/06-nft-marketplace-development/solution.tsx',
      testsPath: './src/exercises/web3-crypto-fintech/06-nft-marketplace-development/test.ts',
      instructionsPath: './src/exercises/web3-crypto-fintech/06-nft-marketplace-development/instructions.md',
    }
  ]
};