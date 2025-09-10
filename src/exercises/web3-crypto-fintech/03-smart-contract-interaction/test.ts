import { TestResult } from '../../../types/test';

export function runTests(userCode: string): TestResult[] {
  const results: TestResult[] = [];
  const startTime = Date.now();

  try {
    // Test 1: Check if ContractProvider class is implemented
    results.push({
      name: 'ContractProvider class exists',
      passed: userCode.includes('class ContractProvider') &&
              userCode.includes('read') &&
              userCode.includes('write'),
      error: userCode.includes('class ContractProvider')
        ? undefined
        : 'ContractProvider class must be implemented with read/write methods',
      executionTime: Date.now() - startTime
    });

    // Test 2: Check for type-safe contract methods
    results.push({
      name: 'Type-safe contract methods',
      passed: userCode.includes('Contract>') &&
              userCode.includes('Parameters') &&
              userCode.includes('ReturnType'),
      error: userCode.includes('Parameters')
        ? undefined
        : 'Must implement type-safe contract methods with TypeScript generics',
      executionTime: Date.now() - startTime
    });

    // Test 3: Check for TransactionManager implementation
    results.push({
      name: 'TransactionManager implemented',
      passed: userCode.includes('useTransactionManager') &&
              userCode.includes('sendTransaction') &&
              userCode.includes('TransactionState'),
      error: userCode.includes('useTransactionManager')
        ? undefined
        : 'Must implement useTransactionManager hook for transaction lifecycle',
      executionTime: Date.now() - startTime
    });

    // Test 4: Check for transaction status tracking
    results.push({
      name: 'Transaction status tracking',
      passed: userCode.includes('pending') &&
              userCode.includes('confirming') &&
              userCode.includes('confirmed') &&
              userCode.includes('failed'),
      error: userCode.includes('confirming')
        ? undefined
        : 'Must track all transaction states: pending, confirming, confirmed, failed',
      executionTime: Date.now() - startTime
    });

    // Test 5: Check for GasEstimator class
    results.push({
      name: 'GasEstimator class implemented',
      passed: userCode.includes('class GasEstimator') &&
              userCode.includes('estimateGas') &&
              userCode.includes('gasLimit'),
      error: userCode.includes('class GasEstimator')
        ? undefined
        : 'GasEstimator class must be implemented with gas estimation',
      executionTime: Date.now() - startTime
    });

    // Test 6: Check for EIP-1559 support
    results.push({
      name: 'EIP-1559 gas pricing support',
      passed: userCode.includes('maxFeePerGas') &&
              userCode.includes('maxPriorityFeePerGas') &&
              userCode.includes('baseFee'),
      error: userCode.includes('maxFeePerGas')
        ? undefined
        : 'Must support EIP-1559 with maxFeePerGas and maxPriorityFeePerGas',
      executionTime: Date.now() - startTime
    });

    // Test 7: Check for event listener system
    results.push({
      name: 'Event listener system implemented',
      passed: userCode.includes('EventListener') &&
              userCode.includes('subscribe') &&
              userCode.includes('contract.on'),
      error: userCode.includes('EventListener')
        ? undefined
        : 'Must implement EventListener for contract event subscriptions',
      executionTime: Date.now() - startTime
    });

    // Test 8: Check for event cleanup
    results.push({
      name: 'Event listener cleanup',
      passed: userCode.includes('contract.off') &&
              userCode.includes('unsubscribe') &&
              userCode.includes('return () =>'),
      error: userCode.includes('contract.off')
        ? undefined
        : 'Must clean up event listeners with contract.off',
      executionTime: Date.now() - startTime
    });

    // Test 9: Check for TokenSwap component
    results.push({
      name: 'TokenSwap component implemented',
      passed: userCode.includes('TokenSwap') &&
              userCode.includes('inputAmount') &&
              userCode.includes('outputAmount') &&
              userCode.includes('slippage'),
      error: userCode.includes('TokenSwap')
        ? undefined
        : 'TokenSwap component must be implemented with slippage protection',
      executionTime: Date.now() - startTime
    });

    // Test 10: Check for approval flow
    results.push({
      name: 'Token approval flow',
      passed: userCode.includes('approve') &&
              userCode.includes('handleApprove') &&
              userCode.includes('allowance'),
      error: userCode.includes('approve')
        ? undefined
        : 'Must implement token approval before swap',
      executionTime: Date.now() - startTime
    });

    // Test 11: Check for gas optimization
    results.push({
      name: 'Gas optimization with buffer',
      passed: userCode.includes('* 1.2') || userCode.includes('* 1.1') ||
              userCode.includes('buffer') && userCode.includes('gasLimit'),
      error: userCode.includes('buffer') || userCode.includes('* 1.2')
        ? undefined
        : 'Must add safety buffer to gas estimates',
      executionTime: Date.now() - startTime
    });

    // Test 12: Check for transaction confirmation tracking
    results.push({
      name: 'Transaction confirmation tracking',
      passed: userCode.includes('confirmations') &&
              userCode.includes('wait') &&
              userCode.includes('receipt'),
      error: userCode.includes('confirmations')
        ? undefined
        : 'Must track transaction confirmations',
      executionTime: Date.now() - startTime
    });

    // Test 13: Check for gas price recommendations
    results.push({
      name: 'Gas price recommendations',
      passed: userCode.includes('slow') &&
              userCode.includes('standard') &&
              userCode.includes('fast') &&
              userCode.includes('getGasPriceRecommendations'),
      error: userCode.includes('getGasPriceRecommendations')
        ? undefined
        : 'Must provide gas price recommendations (slow, standard, fast)',
      executionTime: Date.now() - startTime
    });

    // Test 14: Check for error handling in transactions
    results.push({
      name: 'Transaction error handling',
      passed: userCode.includes('UNPREDICTABLE_GAS_LIMIT') ||
              userCode.includes('INSUFFICIENT_FUNDS') ||
              userCode.includes('CALL_EXCEPTION'),
      error: userCode.includes('CALL_EXCEPTION')
        ? undefined
        : 'Must handle specific transaction errors',
      executionTime: Date.now() - startTime
    });

    // Test 15: Check for contract ABI integration
    results.push({
      name: 'Contract ABI integration',
      passed: userCode.includes('abi') &&
              userCode.includes('interface') &&
              userCode.includes('ContractConfig'),
      error: userCode.includes('abi')
        ? undefined
        : 'Must integrate contract ABI for method calls',
      executionTime: Date.now() - startTime
    });

    // Test 16: Check for transaction UI feedback
    results.push({
      name: 'Transaction status UI',
      passed: userCode.includes('TransactionStatus') &&
              userCode.includes('Timeline') &&
              userCode.includes('getStatusIcon'),
      error: userCode.includes('TransactionStatus')
        ? undefined
        : 'Must display transaction status in UI',
      executionTime: Date.now() - startTime
    });

    // Test 17: Check for gas estimator UI
    results.push({
      name: 'Gas estimator UI component',
      passed: userCode.includes('GasEstimatorUI') &&
              userCode.includes('selectedSpeed') &&
              userCode.includes('IconGasStation'),
      error: userCode.includes('GasEstimatorUI')
        ? undefined
        : 'Must implement gas estimator UI with speed selection',
      executionTime: Date.now() - startTime
    });

    // Test 18: Check for TypeScript interfaces
    results.push({
      name: 'TypeScript interfaces defined',
      passed: userCode.includes('interface TransactionState') &&
              userCode.includes('interface GasSettings') &&
              userCode.includes('interface TokenInfo'),
      error: userCode.includes('interface TransactionState')
        ? undefined
        : 'Must define TypeScript interfaces for contract interaction',
      executionTime: Date.now() - startTime
    });

    // Test 19: Check for slippage calculation
    results.push({
      name: 'Slippage protection implemented',
      passed: userCode.includes('minOutput') &&
              userCode.includes('slippage') &&
              userCode.includes('1 - slippage'),
      error: userCode.includes('minOutput')
        ? undefined
        : 'Must calculate minimum output with slippage protection',
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