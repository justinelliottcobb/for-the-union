// Central test registry initialization
// This file should be imported early in the app lifecycle to pre-load all tests

import { initializeTestRegistry, getTestRegistryStats } from './test-registry';

// Initialize the test registry when this module is imported
let isInitialized = false;
let initPromise: Promise<void> | null = null;

export async function ensureTestRegistryInitialized(): Promise<void> {
  if (isInitialized) {
    return;
  }
  
  if (initPromise) {
    return initPromise;
  }
  
  initPromise = (async () => {
    try {
      console.log('🚀 Initializing test registry...');
      const startTime = performance.now();
      
      await initializeTestRegistry();
      
      const stats = getTestRegistryStats();
      const duration = Math.round(performance.now() - startTime);
      
      console.log(`✅ Test registry initialized in ${duration}ms`);
      console.log(`📊 Loaded tests for ${stats.totalExercises} exercises across ${stats.totalCategories} categories:`);
      
      Object.entries(stats.categoriesWithTests).forEach(([category, count]) => {
        console.log(`   • ${category}: ${count} tests`);
      });
      
      isInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize test registry:', error);
      throw error;
    }
  })();
  
  return initPromise;
}

// Auto-initialize when module is imported (for development)
if (typeof window !== 'undefined') {
  ensureTestRegistryInitialized().catch(console.error);
}

export { getTestRegistryStats } from './test-registry';