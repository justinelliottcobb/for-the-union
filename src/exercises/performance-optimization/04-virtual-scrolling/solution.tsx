import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// Virtual scrolling utility
interface VirtualScrollConfig {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

interface VirtualScrollState {
  startIndex: number;
  endIndex: number;
  visibleItems: number;
  totalHeight: number;
  scrollTop: number;
}

function useVirtualScroll(itemCount: number, config: VirtualScrollConfig) {
  const { itemHeight, containerHeight, overscan = 5 } = config;
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  const totalHeight = itemCount * itemHeight;
  const visibleItemCount = Math.ceil(containerHeight / itemHeight);

  // Calculate visible range with overscan
  const startIndex = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    return Math.max(0, start - overscan);
  }, [scrollTop, itemHeight, overscan]);

  const endIndex = useMemo(() => {
    const end = Math.ceil((scrollTop + containerHeight) / itemHeight);
    return Math.min(itemCount - 1, end + overscan);
  }, [scrollTop, containerHeight, itemHeight, itemCount, overscan]);

  const getItemStyle = useCallback((index: number) => ({
    position: 'absolute' as const,
    top: index * itemHeight,
    height: itemHeight,
    width: '100%',
  }), [itemHeight]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    setIsScrolling(true);

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Set scrolling to false after scroll ends
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    const targetScrollTop = index * itemHeight;
    return targetScrollTop;
  }, [itemHeight]);

  const containerProps = useMemo(() => ({
    style: { overflowY: 'auto' as const, height: containerHeight },
  }), [containerHeight]);

  return {
    startIndex,
    endIndex,
    totalHeight,
    getItemStyle,
    handleScroll,
    scrollToIndex,
    containerProps,
    isScrolling,
  };
}

// Performance monitoring utility
function useVirtualScrollPerformance() {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    scrollFPS: 0,
    visibleItemCount: 0,
    totalRenderTime: 0,
  });

  const startTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);

  const startMeasurement = useCallback(() => {
    startTimeRef.current = performance.now();
  }, []);

  const endMeasurement = useCallback(() => {
    const renderTime = performance.now() - startTimeRef.current;
    setMetrics(prev => ({
      ...prev,
      renderTime,
      totalRenderTime: prev.totalRenderTime + renderTime,
    }));
  }, []);

  const measureFPS = useCallback(() => {
    const now = performance.now();
    const delta = now - lastFrameTimeRef.current;
    
    if (delta > 0) {
      const fps = 1000 / delta;
      setMetrics(prev => ({ ...prev, scrollFPS: Math.round(fps) }));
    }
    
    lastFrameTimeRef.current = now;
    frameCountRef.current++;
  }, []);

  const resetMetrics = useCallback(() => {
    setMetrics({
      renderTime: 0,
      scrollFPS: 0,
      visibleItemCount: 0,
      totalRenderTime: 0,
    });
    frameCountRef.current = 0;
  }, []);

  return { metrics, startMeasurement, endMeasurement, resetMetrics, measureFPS };
}

// Virtual list component
interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  height: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
}

function VirtualList<T>({ items, itemHeight, height, renderItem, className }: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { startMeasurement, endMeasurement } = useVirtualScrollPerformance();

  const {
    startIndex,
    endIndex,
    totalHeight,
    getItemStyle,
    handleScroll,
    containerProps,
    isScrolling,
  } = useVirtualScroll(items.length, { itemHeight, containerHeight: height });

  const visibleItems = useMemo(() => {
    startMeasurement();
    const result = items.slice(startIndex, endIndex + 1);
    endMeasurement();
    return result;
  }, [items, startIndex, endIndex, startMeasurement, endMeasurement]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      style={{ height }}
      onScroll={handleScroll}
      {...containerProps}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map((item, virtualIndex) => {
          const actualIndex = startIndex + virtualIndex;
          return (
            <div
              key={actualIndex}
              style={getItemStyle(actualIndex)}
              className="absolute w-full"
            >
              {renderItem(item, actualIndex)}
            </div>
          );
        })}
        
        {isScrolling && (
          <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
            Scrolling...
          </div>
        )}
      </div>
    </div>
  );
}

// Windowed grid component
interface WindowedGridProps<T> {
  items: T[];
  columnCount: number;
  rowHeight: number;
  columnWidth: number;
  height: number;
  width: number;
  renderCell: (item: T, rowIndex: number, columnIndex: number) => React.ReactNode;
}

function WindowedGrid<T>({
  items,
  columnCount,
  rowHeight,
  columnWidth,
  height,
  width,
  renderCell,
}: WindowedGridProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({
    scrollTop: 0,
    scrollLeft: 0,
  });

  const rowCount = Math.ceil(items.length / columnCount);
  const totalHeight = rowCount * rowHeight;
  const totalWidth = columnCount * columnWidth;

  // Calculate visible ranges with overscan
  const overscan = 3;
  
  const visibleRowStart = Math.max(0, Math.floor(scrollState.scrollTop / rowHeight) - overscan);
  const visibleRowEnd = Math.min(
    rowCount - 1,
    Math.ceil((scrollState.scrollTop + height) / rowHeight) + overscan
  );

  const visibleColumnStart = Math.max(0, Math.floor(scrollState.scrollLeft / columnWidth) - overscan);
  const visibleColumnEnd = Math.min(
    columnCount - 1,
    Math.ceil((scrollState.scrollLeft + width) / columnWidth) + overscan
  );

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollLeft } = e.currentTarget;
    setScrollState({ scrollTop, scrollLeft });
  }, []);

  const visibleCells = useMemo(() => {
    const cells: Array<{
      item: T;
      rowIndex: number;
      columnIndex: number;
      itemIndex: number;
    }> = [];

    for (let rowIndex = visibleRowStart; rowIndex <= visibleRowEnd; rowIndex++) {
      for (let columnIndex = visibleColumnStart; columnIndex <= visibleColumnEnd; columnIndex++) {
        const itemIndex = rowIndex * columnCount + columnIndex;
        if (itemIndex < items.length) {
          cells.push({
            item: items[itemIndex],
            rowIndex,
            columnIndex,
            itemIndex,
          });
        }
      }
    }

    return cells;
  }, [items, visibleRowStart, visibleRowEnd, visibleColumnStart, visibleColumnEnd, columnCount]);

  return (
    <div
      ref={containerRef}
      className="relative overflow-auto border"
      style={{ height, width }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, width: totalWidth, position: 'relative' }}>
        {visibleCells.map((cell) => (
          <div
            key={`${cell.rowIndex}-${cell.columnIndex}`}
            style={{
              position: 'absolute',
              top: cell.rowIndex * rowHeight,
              left: cell.columnIndex * columnWidth,
              height: rowHeight,
              width: columnWidth,
            }}
          >
            {renderCell(cell.item, cell.rowIndex, cell.columnIndex)}
          </div>
        ))}
      </div>
    </div>
  );
}

// Infinite scroller component
interface InfiniteScrollerProps<T> {
  items: T[];
  loadMore: () => Promise<void>;
  hasMore: boolean;
  isLoading: boolean;
  itemHeight: number;
  height: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  threshold?: number;
}

function InfiniteScroller<T>({
  items,
  loadMore,
  hasMore,
  isLoading,
  itemHeight,
  height,
  renderItem,
  threshold = 200,
}: InfiniteScrollerProps<T>) {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    startIndex,
    endIndex,
    totalHeight,
    getItemStyle,
    handleScroll: virtualHandleScroll,
  } = useVirtualScroll(items.length, { itemHeight, containerHeight: height });

  const handleScroll = useCallback(async (e: React.UIEvent<HTMLDivElement>) => {
    // Handle virtual scrolling
    virtualHandleScroll(e);

    // Check for infinite loading
    const target = e.currentTarget;
    const distanceFromBottom = target.scrollHeight - target.scrollTop - target.clientHeight;

    if (distanceFromBottom < threshold && hasMore && !isLoading && !isLoadingMore) {
      setIsLoadingMore(true);
      try {
        await loadMore();
      } catch (error) {
        console.error('Failed to load more items:', error);
      } finally {
        setIsLoadingMore(false);
      }
    }
  }, [virtualHandleScroll, hasMore, isLoading, isLoadingMore, loadMore, threshold]);

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1);
  }, [items, startIndex, endIndex]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="relative overflow-auto"
        style={{ height }}
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          {visibleItems.map((item, virtualIndex) => {
            const actualIndex = startIndex + virtualIndex;
            return (
              <div
                key={actualIndex}
                style={getItemStyle(actualIndex)}
                className="absolute w-full"
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>

      {(isLoading || isLoadingMore) && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white bg-opacity-90 text-center border-t">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span>Loading more items...</span>
          </div>
        </div>
      )}

      {!hasMore && items.length > 0 && (
        <div className="p-4 text-center text-gray-500 border-t">
          No more items to load
        </div>
      )}
    </div>
  );
}

// Performance benchmark component
interface BenchmarkResults {
  component: string;
  itemCount: number;
  renderTime: number;
  memoryUsage: number;
  scrollPerformance: number;
}

function PerformanceBenchmark() {
  const [results, setResults] = useState<BenchmarkResults[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runBenchmark = useCallback(async () => {
    setIsRunning(true);
    const newResults: BenchmarkResults[] = [];

    // Test different configurations
    const testConfigs = [
      { component: 'Virtual List', itemCount: 1000 },
      { component: 'Virtual List', itemCount: 10000 },
      { component: 'Virtual List', itemCount: 50000 },
    ];

    for (const config of testConfigs) {
      const start = performance.now();
      
      // Simulate rendering time
      await new Promise(resolve => {
        setTimeout(() => {
          const renderTime = performance.now() - start;
          const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;
          
          newResults.push({
            component: config.component,
            itemCount: config.itemCount,
            renderTime,
            memoryUsage: memoryUsage / 1024 / 1024, // Convert to MB
            scrollPerformance: Math.random() * 60 + 30, // Simulated FPS
          });
          
          resolve(void 0);
        }, 100);
      });
    }

    setResults(newResults);
    setIsRunning(false);
  }, []);

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <h3 className="font-semibold mb-4">Performance Benchmark</h3>
      
      <button
        onClick={runBenchmark}
        disabled={isRunning}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
      >
        {isRunning ? 'Running Benchmark...' : 'Run Performance Test'}
      </button>

      {results.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Component</th>
                <th className="text-left p-2">Items</th>
                <th className="text-left p-2">Render Time</th>
                <th className="text-left p-2">Memory (MB)</th>
                <th className="text-left p-2">Scroll FPS</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => (
                <tr key={index} className="border-b">
                  <td className="p-2">{result.component}</td>
                  <td className="p-2">{result.itemCount.toLocaleString()}</td>
                  <td className="p-2">{result.renderTime.toFixed(2)}ms</td>
                  <td className="p-2">{result.memoryUsage.toFixed(1)}</td>
                  <td className="p-2">{result.scrollPerformance.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Main demo component
export default function VirtualScrollingDemo() {
  const [listItemCount, setListItemCount] = useState(10000);
  const [gridItemCount, setGridItemCount] = useState(50000);
  const [selectedDemo, setSelectedDemo] = useState<'list' | 'grid' | 'infinite'>('list');

  // List data
  const listData = useMemo(() => {
    return Array.from({ length: listItemCount }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      description: `Description for item ${i} with some additional content to make it realistic`,
      value: Math.floor(Math.random() * 1000),
      category: ['Electronics', 'Books', 'Clothing', 'Home'][i % 4],
      timestamp: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
    }));
  }, [listItemCount]);

  // Grid data
  const gridData = useMemo(() => {
    return Array.from({ length: gridItemCount }, (_, i) => ({
      id: i,
      color: `hsl(${(i * 137) % 360}, ${50 + (i % 30)}%, ${40 + (i % 40)}%)`,
      value: i,
      label: `Cell ${i}`,
    }));
  }, [gridItemCount]);

  // Infinite scroll state
  const [infiniteItems, setInfiniteItems] = useState<any[]>(
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      title: `Initial Item ${i}`,
      description: `This is the description for item ${i}`,
      timestamp: new Date().toISOString(),
    }))
  );
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const loadMoreItems = useCallback(async () => {
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const currentLength = infiniteItems.length;
    const newItems = Array.from({ length: 20 }, (_, i) => ({
      id: currentLength + i,
      title: `Loaded Item ${currentLength + i}`,
      description: `This item was loaded dynamically`,
      timestamp: new Date().toISOString(),
    }));

    setInfiniteItems(prev => [...prev, ...newItems]);
    
    // Stop loading after 500 items
    if (currentLength + newItems.length >= 500) {
      setHasMore(false);
    }
    
    setIsLoading(false);
  }, [infiniteItems.length]);

  // Render functions
  const renderListItem = useCallback((item: any, index: number) => {
    return (
      <div className="p-4 border-b flex justify-between items-center hover:bg-gray-50">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{item.name}</h4>
          <p className="text-sm text-gray-600">{item.description}</p>
          <p className="text-xs text-gray-400">#{index} • {item.timestamp?.slice(0, 10)}</p>
        </div>
        <div className="text-right ml-4">
          <div className="font-semibold text-green-600">${item.value}</div>
          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {item.category}
          </div>
        </div>
      </div>
    );
  }, []);

  const renderGridCell = useCallback((item: any, rowIndex: number, columnIndex: number) => {
    return (
      <div
        className="border border-gray-200 flex items-center justify-center text-white text-xs font-bold relative overflow-hidden"
        style={{ backgroundColor: item.color }}
      >
        <span className="z-10">{item.value}</span>
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
      </div>
    );
  }, []);

  const renderInfiniteItem = useCallback((item: any, index: number) => {
    return (
      <div className="p-4 border-b">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-medium">{item.title}</h4>
            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
          </div>
          <span className="text-xs text-gray-400">#{index}</span>
        </div>
      </div>
    );
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Virtual Scrolling & Large Dataset Performance
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            This demo showcases virtual scrolling techniques for handling large datasets efficiently.
            Monitor browser performance tools to see the difference virtual scrolling makes.
          </p>
        </div>

        {/* Performance monitoring */}
        <PerformanceBenchmark />

        {/* Demo selection */}
        <div className="flex justify-center space-x-4">
          {[
            { key: 'list', label: 'Virtual List' },
            { key: 'grid', label: 'Windowed Grid' },
            { key: 'infinite', label: 'Infinite Scroll' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSelectedDemo(key as any)}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                selectedDemo === key
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-4">Demo Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                List Items: {listItemCount.toLocaleString()}
              </label>
              <input
                type="range"
                min="1000"
                max="100000"
                step="1000"
                value={listItemCount}
                onChange={(e) => setListItemCount(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grid Items: {gridItemCount.toLocaleString()}
              </label>
              <input
                type="range"
                min="1000"
                max="100000"
                step="1000"
                value={gridItemCount}
                onChange={(e) => setGridItemCount(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Demo content */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            {selectedDemo === 'list' && (
              <h2 className="text-2xl font-semibold text-gray-800">
                Virtual List Demo ({listItemCount.toLocaleString()} items)
              </h2>
            )}
            {selectedDemo === 'grid' && (
              <h2 className="text-2xl font-semibold text-gray-800">
                Windowed Grid Demo ({gridItemCount.toLocaleString()} cells)
              </h2>
            )}
            {selectedDemo === 'infinite' && (
              <h2 className="text-2xl font-semibold text-gray-800">
                Infinite Scroll Demo ({infiniteItems.length} items loaded)
              </h2>
            )}
          </div>

          <div className="p-6">
            {selectedDemo === 'list' && (
              <VirtualList
                items={listData}
                itemHeight={100}
                height={500}
                renderItem={renderListItem}
                className="border rounded"
              />
            )}

            {selectedDemo === 'grid' && (
              <div className="flex justify-center">
                <WindowedGrid
                  items={gridData}
                  columnCount={25}
                  rowHeight={40}
                  columnWidth={40}
                  height={500}
                  width={1000}
                  renderCell={renderGridCell}
                />
              </div>
            )}

            {selectedDemo === 'infinite' && (
              <InfiniteScroller
                items={infiniteItems}
                loadMore={loadMoreItems}
                hasMore={hasMore}
                isLoading={isLoading}
                itemHeight={80}
                height={500}
                renderItem={renderInfiniteItem}
              />
            )}
          </div>
        </div>

        {/* Performance tips */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">Virtual Scrolling Performance Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ul className="text-sm text-blue-700 space-y-2">
              <li>• Virtual scrolling renders only visible items, keeping DOM size constant</li>
              <li>• Use React.memo for list items to prevent unnecessary re-renders</li>
              <li>• Implement proper key props for efficient React reconciliation</li>
              <li>• Consider overscan to reduce white space during fast scrolling</li>
            </ul>
            <ul className="text-sm text-blue-700 space-y-2">
              <li>• Monitor scroll performance with browser dev tools</li>
              <li>• Use passive event listeners for better scroll performance</li>
              <li>• Batch scroll events to avoid excessive calculations</li>
              <li>• Profile memory usage to ensure constant DOM node count</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}