// Debug utility to test the modular test system
import { ensureTestRegistryInitialized, getTestRegistryStats } from './test-index';
import { getTestRunner } from './test-registry';
import { debugTestRegistry } from './test-utils';

export async function testModularSystem() {
  console.group('🧪 Testing Modular Test System');
  
  try {
    // 1. Initialize the registry
    console.log('1. Initializing test registry...');
    await ensureTestRegistryInitialized();
    
    // 2. Check stats
    console.log('2. Getting registry stats...');
    const stats = getTestRegistryStats();
    console.log('Stats:', stats);
    
    // 3. Test loading a specific test
    console.log('3. Testing specific test loading...');
    const testRunner = await getTestRunner('react-hooks', '01-usestate-fundamentals');
    console.log('Test runner loaded:', !!testRunner);
    
    if (testRunner) {
      // 4. Run a sample test
      console.log('4. Running sample test...');
      const sampleCode = `
        function Counter() {
          const [count, setCount] = useState(0);
          return _jsx("div", {});
        }
      `;
      const results = testRunner(sampleCode);
      console.log('Test results:', results.length, 'tests');
      results.forEach(result => {
        console.log(`  - ${result.name}: ${result.passed ? '✅' : '❌'}`);
      });
    }
    
    // 5. Debug registry contents
    console.log('5. Registry debug info:');
    debugTestRegistry();
    
    console.log('✅ Modular test system working correctly!');
    
  } catch (error) {
    console.error('❌ Error testing modular system:', error);
  }
  
  console.groupEnd();
}

// Auto-run in development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  setTimeout(() => {
    testModularSystem().catch(console.error);
  }, 2000); // Wait 2 seconds for app to initialize
}