import type { TestResult } from '@/types';
import { createComponentTest } from '@/lib/test-utils';

export function runTests(compiledCode: string): TestResult[] {
  const tests: TestResult[] = [];

  // Test ChainSwitcher class implementation
  tests.push({
    name: 'ChainSwitcher class exists',
    passed: compiledCode.includes('class ChainSwitcher'),
    error: !compiledCode.includes('class ChainSwitcher') ? 'ChainSwitcher class is missing' : undefined,
    executionTime: 1
  });

  tests.push({
    name: 'ChainSwitcher switchChain method',
    passed: compiledCode.includes('switchChain') && compiledCode.includes('async switchChain'),
    error: !compiledCode.includes('async switchChain') ? 'ChainSwitcher needs async switchChain method' : undefined,
    executionTime: 1
  });

  // Test BridgeInterface class implementation
  tests.push({
    name: 'BridgeInterface class exists',
    passed: compiledCode.includes('class BridgeInterface'),
    error: !compiledCode.includes('class BridgeInterface') ? 'BridgeInterface class is missing' : undefined,
    executionTime: 1
  });

  tests.push({
    name: 'BridgeInterface initiateBridge method',
    passed: compiledCode.includes('initiateBridge') && compiledCode.includes('async initiateBridge'),
    error: !compiledCode.includes('async initiateBridge') ? 'BridgeInterface needs async initiateBridge method' : undefined,
    executionTime: 1
  });

  // Test L2Monitor class implementation
  tests.push({
    name: 'L2Monitor class exists',
    passed: compiledCode.includes('class L2Monitor'),
    error: !compiledCode.includes('class L2Monitor') ? 'L2Monitor class is missing' : undefined,
    executionTime: 1
  });

  tests.push({
    name: 'L2Monitor sequencer monitoring',
    passed: compiledCode.includes('monitorSequencerStatus'),
    error: !compiledCode.includes('monitorSequencerStatus') ? 'L2Monitor needs monitorSequencerStatus method' : undefined,
    executionTime: 1
  });

  // Test CrossChainManager class implementation
  tests.push({
    name: 'CrossChainManager class exists',
    passed: compiledCode.includes('class CrossChainManager'),
    error: !compiledCode.includes('class CrossChainManager') ? 'CrossChainManager class is missing' : undefined,
    executionTime: 1
  });

  tests.push({
    name: 'CrossChainManager arbitrage functionality',
    passed: compiledCode.includes('executeArbitrage'),
    error: !compiledCode.includes('executeArbitrage') ? 'CrossChainManager needs executeArbitrage method' : undefined,
    executionTime: 1
  });

  // Test React component implementation
  tests.push(createComponentTest('Layer2MultichainIntegrationExercise', compiledCode, {
    requiredElements: ['Container', 'Title', 'Tabs'],
    customValidation: (code) => code.includes('useState') && code.includes('ethers'),
    errorMessage: 'Main component needs proper React hooks and ethers integration'
  }));

  // Test network configuration
  tests.push({
    name: 'Network configuration defined',
    passed: compiledCode.includes('NetworkConfig') && compiledCode.includes('chainId'),
    error: !compiledCode.includes('NetworkConfig') ? 'NetworkConfig interface is missing' : undefined,
    executionTime: 1
  });

  // Test bridge protocol support
  tests.push({
    name: 'Bridge protocol interfaces',
    passed: compiledCode.includes('BridgeProtocol') && compiledCode.includes('BridgeOperation'),
    error: !compiledCode.includes('BridgeProtocol') ? 'Bridge protocol interfaces are missing' : undefined,
    executionTime: 1
  });

  // Test multi-chain support
  tests.push({
    name: 'Multi-chain network support',
    passed: compiledCode.includes('Ethereum') && compiledCode.includes('Polygon') && compiledCode.includes('Arbitrum'),
    error: 'Multi-chain network configuration should include Ethereum, Polygon, and Arbitrum',
    executionTime: 1
  });

  return tests;
}