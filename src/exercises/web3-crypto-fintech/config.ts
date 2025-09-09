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
    },
    {
      id: '07-web3-security-patterns',
      title: 'Web3 Security Patterns',
      description: 'Implement enterprise-grade security patterns with transaction validation, phishing protection, and audit logging',
      category: 'web3-crypto-fintech',
      difficulty: 5,
      prerequisites: ['01-web3-wallet-integration', '03-smart-contract-interaction'],
      learningObjectives: [
        'Implement comprehensive security providers for Web3 applications with multi-layered protection',
        'Build transaction validators with simulation, analysis, and approval workflows',
        'Create phishing detection systems to protect users from malicious sites and contracts',
        'Develop audit logging systems for compliance and security monitoring',
        'Integrate hardware wallet support with secure transaction signing flows'
      ],
      hints: [
        'Use transaction simulation APIs like Tenderly for pre-execution analysis',
        'Implement multiple IPFS gateways for metadata resolution reliability',
        'Create immutable audit trails using cryptographic hash chains',
        'Add hardware wallet support for Ledger and Trezor devices',
        'Implement multi-signature wallet workflows for institutional security'
      ],
      estimatedTime: 90,
      filePath: './exercise-files/web3-crypto-fintech/07-web3-security-patterns/exercise.tsx',
      solutionPath: './src/exercises/web3-crypto-fintech/07-web3-security-patterns/solution.tsx',
      testsPath: './src/exercises/web3-crypto-fintech/07-web3-security-patterns/test.ts',
      instructionsPath: './src/exercises/web3-crypto-fintech/07-web3-security-patterns/instructions.md',
    },
    {
      id: '08-regulatory-compliance-systems',
      title: 'Regulatory Compliance Systems',
      description: 'Build comprehensive compliance features with KYC/AML integration, tax reporting, and GDPR compliance',
      category: 'web3-crypto-fintech',
      difficulty: 5,
      prerequisites: ['07-web3-security-patterns'],
      learningObjectives: [
        'Build KYC/AML integration systems with identity verification and document processing',
        'Implement automated compliance monitoring with real-time transaction screening',
        'Create comprehensive tax reporting with multi-jurisdiction support and automated calculations',
        'Develop compliance dashboards with audit trails and regulatory reporting',
        'Integrate GDPR and data privacy controls with user consent management and data portability'
      ],
      hints: [
        'Integrate with KYC providers like Jumio, Onfido, or Veriff for identity verification',
        'Implement watchlist screening against OFAC, UN, and EU sanctions lists',
        'Calculate taxes using FIFO, LIFO, or specific identification methods',
        'Create configurable compliance policies with automated enforcement',
        'Implement GDPR data rights with automated request processing'
      ],
      estimatedTime: 90,
      filePath: './exercise-files/web3-crypto-fintech/08-regulatory-compliance-systems/exercise.tsx',
      solutionPath: './src/exercises/web3-crypto-fintech/08-regulatory-compliance-systems/solution.tsx',
      testsPath: './src/exercises/web3-crypto-fintech/08-regulatory-compliance-systems/test.ts',
      instructionsPath: './src/exercises/web3-crypto-fintech/08-regulatory-compliance-systems/instructions.md',
    },
    {
      id: '09-risk-management-interfaces',
      title: 'Risk Management Interfaces',
      description: 'Develop sophisticated risk assessment tools with VaR calculations, portfolio analysis, and automated controls',
      category: 'web3-crypto-fintech',
      difficulty: 5,
      prerequisites: ['05-trading-interface-patterns', '07-web3-security-patterns'],
      learningObjectives: [
        'Build comprehensive risk assessment systems with portfolio analysis and risk metrics calculation',
        'Implement advanced portfolio analyzers with correlation analysis and diversification metrics',
        'Create intelligent alert systems with real-time monitoring and automated notifications',
        'Develop position limit managers with dynamic risk controls and automated enforcement',
        'Design VaR calculators with Monte Carlo simulation and stress testing capabilities'
      ],
      hints: [
        'Implement multiple VaR methodologies: historical simulation, parametric, and Monte Carlo',
        'Calculate portfolio risk metrics including Sharpe ratio, maximum drawdown, and beta',
        'Create configurable alert rules with cooldown periods and severity levels',
        'Implement position limits with percentage, absolute, and VaR-based constraints',
        'Add stress testing with scenario analysis and correlation breakdown'
      ],
      estimatedTime: 90,
      filePath: './exercise-files/web3-crypto-fintech/09-risk-management-interfaces/exercise.tsx',
      solutionPath: './src/exercises/web3-crypto-fintech/09-risk-management-interfaces/solution.tsx',
      testsPath: './src/exercises/web3-crypto-fintech/09-risk-management-interfaces/test.ts',
      instructionsPath: './src/exercises/web3-crypto-fintech/09-risk-management-interfaces/instructions.md',
    },
    {
      id: '10-layer2-multichain-integration',
      title: 'Layer 2 & Multi-chain Integration',
      description: 'Master multi-chain and Layer 2 scaling solutions with chain switching, bridge protocols, and cross-chain coordination',
      category: 'web3-crypto-fintech',
      difficulty: 5,
      prerequisites: ['04-defi-protocol-integration', '07-web3-security-patterns'],
      learningObjectives: [
        'Build chain switching systems that handle multiple Ethereum L1 and L2 networks seamlessly',
        'Implement bridge interfaces supporting major protocols (Hop, Across, Arbitrum Bridge)',
        'Create L2 monitoring systems with sequencer health tracking and performance metrics',
        'Develop cross-chain managers for arbitrage execution and multi-chain governance coordination',
        'Optimize gas strategies across different networks with dynamic fee estimation and routing'
      ],
      hints: [
        'Create a unified interface for different bridge protocols with standardized APIs',
        'Implement chain detection and automatic network switching based on user needs',
        'Monitor L2 sequencer health and provide fallback mechanisms for downtime',
        'Use cross-chain messaging protocols for complex multi-chain operations',
        'Optimize gas costs by choosing the right network for each operation type'
      ],
      estimatedTime: 90,
      filePath: './exercise-files/web3-crypto-fintech/10-layer2-multichain-integration/exercise.tsx',
      solutionPath: './src/exercises/web3-crypto-fintech/10-layer2-multichain-integration/solution.tsx',
      testsPath: './src/exercises/web3-crypto-fintech/10-layer2-multichain-integration/test.ts',
      instructionsPath: './src/exercises/web3-crypto-fintech/10-layer2-multichain-integration/instructions.md',
    },
    {
      id: '11-web3-state-management',
      title: 'Web3 State Management',
      description: 'Implement advanced state management patterns for complex Web3 applications with blockchain synchronization',
      category: 'web3-crypto-fintech',
      difficulty: 5,
      prerequisites: ['03-smart-contract-interaction', '08-regulatory-compliance-systems'],
      learningObjectives: [
        'Build centralized Web3 state managers with subscription patterns and middleware support',
        'Create transaction queues with priority handling, retry logic, and gas optimization',
        'Implement multi-level caching systems with intelligent invalidation and background refresh',
        'Develop blockchain sync engines with conflict resolution and state merging capabilities',
        'Design optimistic update managers for responsive user interfaces with rollback support'
      ],
      hints: [
        'Use Redux-like patterns but optimized for Web3 with blockchain-specific middleware',
        'Implement optimistic updates for immediate UI feedback with automatic rollbacks',
        'Create intelligent caching that understands blockchain finality and reorg handling',
        'Build sync engines that can handle multiple data sources and conflicting state',
        'Add time-travel debugging capabilities for easier Web3 development workflows'
      ],
      estimatedTime: 90,
      filePath: './exercise-files/web3-crypto-fintech/11-web3-state-management/exercise.tsx',
      solutionPath: './src/exercises/web3-crypto-fintech/11-web3-state-management/solution.tsx',
      testsPath: './src/exercises/web3-crypto-fintech/11-web3-state-management/test.ts',
      instructionsPath: './src/exercises/web3-crypto-fintech/11-web3-state-management/instructions.md',
    },
    {
      id: '12-web3-performance-monitoring',
      title: 'Web3 Performance Monitoring',
      description: 'Build comprehensive performance monitoring systems with transaction analytics and gas optimization',
      category: 'web3-crypto-fintech',
      difficulty: 5,
      prerequisites: ['11-web3-state-management', '09-risk-management-interfaces'],
      learningObjectives: [
        'Create performance analyzers that track transaction speeds, gas efficiency, and user experience metrics',
        'Build transaction trackers with end-to-end monitoring, gas price optimization, and network health detection',
        'Implement metrics collectors with real-time aggregation, custom definitions, and multi-source data integration',
        'Develop alert systems with configurable rules, multi-channel notifications, and performance baseline management',
        'Design performance dashboards with real-time charts, optimization insights, and actionable recommendations'
      ],
      hints: [
        'Use performance APIs to measure Web3 operation timing with sub-millisecond precision',
        'Implement gas price prediction models using historical data and network congestion analysis',
        'Create metrics dashboards with time series databases for historical performance tracking',
        'Build alerting systems that can detect performance regressions and unusual patterns',
        'Add performance profiling with flame graphs and bottleneck identification'
      ],
      estimatedTime: 90,
      filePath: './exercise-files/web3-crypto-fintech/12-web3-performance-monitoring/exercise.tsx',
      solutionPath: './src/exercises/web3-crypto-fintech/12-web3-performance-monitoring/solution.tsx',
      testsPath: './src/exercises/web3-crypto-fintech/12-web3-performance-monitoring/test.ts',
      instructionsPath: './src/exercises/web3-crypto-fintech/12-web3-performance-monitoring/instructions.md',
    }
  ]
};