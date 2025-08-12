import type { TestResult } from '@/types';

export function runTests(compiledCode: string): TestResult[] {
  const tests: TestResult[] = [];

  // Helper function to extract hook/component code
  function extractComponentCode(code: string, componentName: string): string {
    // Standard function pattern
    let functionPattern = new RegExp(`function ${componentName}\\(.*?\\)\\s*{([\\s\\S]*?)}(?=\\s*(?:function|export|$))`, 'i');
    let match = code.match(functionPattern);
    
    if (!match) {
      // Try a more flexible pattern that looks for the function and captures everything until the next function or end
      const startPattern = new RegExp(`function ${componentName}\\(.*?\\)\\s*{`, 'i');
      const startMatch = code.match(startPattern);
      
      if (startMatch) {
        const startIndex = code.indexOf(startMatch[0]) + startMatch[0].length;
        let braceCount = 1;
        let endIndex = startIndex;
        
        // Find the matching closing brace
        for (let i = startIndex; i < code.length && braceCount > 0; i++) {
          if (code[i] === '{') braceCount++;
          if (code[i] === '}') braceCount--;
          endIndex = i;
        }
        
        if (braceCount === 0) {
          return code.substring(startIndex, endIndex);
        }
      }
    }
    
    return match ? match[1] : '';
  }

  // Check useRoutePreloader custom hook
  const useRoutePreloaderSection = extractComponentCode(compiledCode, 'useRoutePreloader');
  tests.push({
    name: 'useRoutePreloader custom hook implementation',
    passed: useRoutePreloaderSection.includes('useRef') &&
            useRoutePreloaderSection.includes('preloadRoute') &&
            useRoutePreloaderSection.includes('getPreloadedData') &&
            useRoutePreloaderSection.includes('clearPreloadCache') &&
            !useRoutePreloaderSection.includes('return mockFetch(route)'),
    error: useRoutePreloaderSection.includes('useRef') &&
           useRoutePreloaderSection.includes('preloadRoute') &&
           useRoutePreloaderSection.includes('getPreloadedData') &&
           useRoutePreloaderSection.includes('clearPreloadCache') &&
           !useRoutePreloaderSection.includes('return mockFetch(route)')
      ? undefined 
      : 'useRoutePreloader hook needs useRef, preloadRoute, getPreloadedData, clearPreloadCache functions',
    executionTime: 1,
  });

  // Check useBackgroundSync custom hook
  const useBackgroundSyncSection = extractComponentCode(compiledCode, 'useBackgroundSync');
  tests.push({
    name: 'useBackgroundSync custom hook implementation',
    passed: useBackgroundSyncSection.includes('useState') &&
            useBackgroundSyncSection.includes('useCallback') &&
            useBackgroundSyncSection.includes('useEffect') &&
            useBackgroundSyncSection.includes('sync') &&
            !useBackgroundSyncSection.includes('data: null,\n    loading: false'),
    error: useBackgroundSyncSection.includes('useState') &&
           useBackgroundSyncSection.includes('useCallback') &&
           useBackgroundSyncSection.includes('useEffect') &&
           useBackgroundSyncSection.includes('sync') &&
           !useBackgroundSyncSection.includes('data: null,\n    loading: false')
      ? undefined 
      : 'useBackgroundSync hook needs useState, useCallback, useEffect, and sync function',
    executionTime: 1,
  });

  // Check useProgressiveImage custom hook
  const useProgressiveImageSection = extractComponentCode(compiledCode, 'useProgressiveImage');
  tests.push({
    name: 'useProgressiveImage custom hook implementation',
    passed: useProgressiveImageSection.includes('useState') &&
            useProgressiveImageSection.includes('useEffect') &&
            (useProgressiveImageSection.includes('Image') || useProgressiveImageSection.includes('new Image')) &&
            !useProgressiveImageSection.includes('src: placeholder'),
    error: useProgressiveImageSection.includes('useState') &&
           useProgressiveImageSection.includes('useEffect') &&
           (useProgressiveImageSection.includes('Image') || useProgressiveImageSection.includes('new Image')) &&
           !useProgressiveImageSection.includes('src: placeholder')
      ? undefined 
      : 'useProgressiveImage hook needs useState, useEffect, and Image object for progressive loading',
    executionTime: 1,
  });

  // Check useIntersectionObserver custom hook
  const useIntersectionObserverSection = extractComponentCode(compiledCode, 'useIntersectionObserver');
  tests.push({
    name: 'useIntersectionObserver custom hook implementation',
    passed: useIntersectionObserverSection.includes('useEffect') &&
            useIntersectionObserverSection.includes('IntersectionObserver') &&
            useIntersectionObserverSection.includes('observe'),
    error: useIntersectionObserverSection.includes('useEffect') &&
           useIntersectionObserverSection.includes('IntersectionObserver') &&
           useIntersectionObserverSection.includes('observe')
      ? undefined 
      : 'useIntersectionObserver hook needs useEffect, IntersectionObserver, and observe functionality',
    executionTime: 1,
  });

  // Check useSmartPreloader custom hook
  const useSmartPreloaderSection = extractComponentCode(compiledCode, 'useSmartPreloader');
  tests.push({
    name: 'useSmartPreloader custom hook implementation',
    passed: useSmartPreloaderSection.includes('useState') &&
            useSmartPreloaderSection.includes('useRef') &&
            (useSmartPreloaderSection.includes('priority') || useSmartPreloaderSection.includes('dependencies')) &&
            !useSmartPreloaderSection.includes('const loadedItems = new Map'),
    error: useSmartPreloaderSection.includes('useState') &&
           useSmartPreloaderSection.includes('useRef') &&
           (useSmartPreloaderSection.includes('priority') || useSmartPreloaderSection.includes('dependencies')) &&
           !useSmartPreloaderSection.includes('const loadedItems = new Map')
      ? undefined 
      : 'useSmartPreloader hook needs useState, useRef, and priority/dependency handling',
    executionTime: 1,
  });

  // Check usePrefetchOnHover custom hook
  const usePrefetchOnHoverSection = extractComponentCode(compiledCode, 'usePrefetchOnHover');
  tests.push({
    name: 'usePrefetchOnHover custom hook implementation',
    passed: usePrefetchOnHoverSection.includes('useState') &&
            usePrefetchOnHoverSection.includes('useRef') &&
            usePrefetchOnHoverSection.includes('handleMouseEnter') &&
            usePrefetchOnHoverSection.includes('handleMouseLeave') &&
            !usePrefetchOnHoverSection.includes('data: null,\n    isPrefetched: false'),
    error: usePrefetchOnHoverSection.includes('useState') &&
           usePrefetchOnHoverSection.includes('useRef') &&
           usePrefetchOnHoverSection.includes('handleMouseEnter') &&
           usePrefetchOnHoverSection.includes('handleMouseLeave') &&
           !usePrefetchOnHoverSection.includes('data: null,\n    isPrefetched: false')
      ? undefined 
      : 'usePrefetchOnHover hook needs useState, useRef, and mouse event handlers',
    executionTime: 1,
  });

  // Check useInfiniteScroll custom hook
  const useInfiniteScrollSection = extractComponentCode(compiledCode, 'useInfiniteScroll');
  tests.push({
    name: 'useInfiniteScroll custom hook implementation',
    passed: useInfiniteScrollSection.includes('useState') &&
            useInfiniteScrollSection.includes('useRef') &&
            useInfiniteScrollSection.includes('containerRef') &&
            (useInfiniteScrollSection.includes('scroll') || useInfiniteScrollSection.includes('threshold')) &&
            !useInfiniteScrollSection.includes('items: [] as T[]'),
    error: useInfiniteScrollSection.includes('useState') &&
           useInfiniteScrollSection.includes('useRef') &&
           useInfiniteScrollSection.includes('containerRef') &&
           (useInfiniteScrollSection.includes('scroll') || useInfiniteScrollSection.includes('threshold')) &&
           !useInfiniteScrollSection.includes('items: [] as T[]')
      ? undefined 
      : 'useInfiniteScroll hook needs useState, useRef, containerRef, and scroll handling',
    executionTime: 1,
  });

  // Check RoutePreloaderDemo component
  const routePreloaderDemoSection = extractComponentCode(compiledCode, 'RoutePreloaderDemo');
  tests.push({
    name: 'RoutePreloaderDemo component implementation',
    passed: (routePreloaderDemoSection.includes('_jsx') || routePreloaderDemoSection.includes('<')) && 
            routePreloaderDemoSection.includes('useRoutePreloader') &&
            !routePreloaderDemoSection.includes('return null'),
    error: (routePreloaderDemoSection.includes('_jsx') || routePreloaderDemoSection.includes('<')) && 
           routePreloaderDemoSection.includes('useRoutePreloader') &&
           !routePreloaderDemoSection.includes('return null')
      ? undefined 
      : 'RoutePreloaderDemo component needs JSX with useRoutePreloader hook (not return null)',
    executionTime: 1,
  });

  // Check BackgroundSyncDemo component
  const backgroundSyncDemoSection = extractComponentCode(compiledCode, 'BackgroundSyncDemo');
  tests.push({
    name: 'BackgroundSyncDemo component implementation',
    passed: (backgroundSyncDemoSection.includes('_jsx') || backgroundSyncDemoSection.includes('<')) && 
            backgroundSyncDemoSection.includes('useBackgroundSync') &&
            !backgroundSyncDemoSection.includes('return null'),
    error: (backgroundSyncDemoSection.includes('_jsx') || backgroundSyncDemoSection.includes('<')) && 
           backgroundSyncDemoSection.includes('useBackgroundSync') &&
           !backgroundSyncDemoSection.includes('return null')
      ? undefined 
      : 'BackgroundSyncDemo component needs JSX with useBackgroundSync hook (not return null)',
    executionTime: 1,
  });

  // Check ProgressiveImageGallery component
  const progressiveImageGallerySection = extractComponentCode(compiledCode, 'ProgressiveImageGallery');
  tests.push({
    name: 'ProgressiveImageGallery component implementation',
    passed: (progressiveImageGallerySection.includes('_jsx') || progressiveImageGallerySection.includes('<')) && 
            progressiveImageGallerySection.includes('useProgressiveImage') &&
            !progressiveImageGallerySection.includes('return null'),
    error: (progressiveImageGallerySection.includes('_jsx') || progressiveImageGallerySection.includes('<')) && 
           progressiveImageGallerySection.includes('useProgressiveImage') &&
           !progressiveImageGallerySection.includes('return null')
      ? undefined 
      : 'ProgressiveImageGallery component needs JSX with useProgressiveImage hook (not return null)',
    executionTime: 1,
  });

  // Check LazyLoadedList component
  const lazyLoadedListSection = extractComponentCode(compiledCode, 'LazyLoadedList');
  tests.push({
    name: 'LazyLoadedList component implementation',
    passed: (lazyLoadedListSection.includes('_jsx') || lazyLoadedListSection.includes('<')) && 
            lazyLoadedListSection.includes('useIntersectionObserver') &&
            !lazyLoadedListSection.includes('return null'),
    error: (lazyLoadedListSection.includes('_jsx') || lazyLoadedListSection.includes('<')) && 
           lazyLoadedListSection.includes('useIntersectionObserver') &&
           !lazyLoadedListSection.includes('return null')
      ? undefined 
      : 'LazyLoadedList component needs JSX with useIntersectionObserver hook (not return null)',
    executionTime: 1,
  });

  // Check SmartPreloaderDemo component
  const smartPreloaderDemoSection = extractComponentCode(compiledCode, 'SmartPreloaderDemo');
  tests.push({
    name: 'SmartPreloaderDemo component implementation',
    passed: (smartPreloaderDemoSection.includes('_jsx') || smartPreloaderDemoSection.includes('<')) && 
            smartPreloaderDemoSection.includes('useSmartPreloader') &&
            !smartPreloaderDemoSection.includes('return null'),
    error: (smartPreloaderDemoSection.includes('_jsx') || smartPreloaderDemoSection.includes('<')) && 
           smartPreloaderDemoSection.includes('useSmartPreloader') &&
           !smartPreloaderDemoSection.includes('return null')
      ? undefined 
      : 'SmartPreloaderDemo component needs JSX with useSmartPreloader hook (not return null)',
    executionTime: 1,
  });

  // Check PrefetchHoverDemo component
  const prefetchHoverDemoSection = extractComponentCode(compiledCode, 'PrefetchHoverDemo');
  tests.push({
    name: 'PrefetchHoverDemo component implementation',
    passed: (prefetchHoverDemoSection.includes('_jsx') || prefetchHoverDemoSection.includes('<')) && 
            prefetchHoverDemoSection.includes('usePrefetchOnHover') &&
            !prefetchHoverDemoSection.includes('return null'),
    error: (prefetchHoverDemoSection.includes('_jsx') || prefetchHoverDemoSection.includes('<')) && 
           prefetchHoverDemoSection.includes('usePrefetchOnHover') &&
           !prefetchHoverDemoSection.includes('return null')
      ? undefined 
      : 'PrefetchHoverDemo component needs JSX with usePrefetchOnHover hook (not return null)',
    executionTime: 1,
  });

  return tests;
}