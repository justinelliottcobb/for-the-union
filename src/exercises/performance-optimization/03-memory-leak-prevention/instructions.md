# Memory Leak Prevention & Detection

**Difficulty:** ⭐⭐⭐⭐⭐ (90 minutes)

## Learning Objectives

By completing this exercise, you will:

- Understand common sources of memory leaks in React applications
- Learn to implement memory monitoring and leak detection utilities
- Master proper cleanup patterns for event listeners, subscriptions, and resources
- Practice using WeakMap and WeakSet for automatic garbage collection
- Implement AbortController for canceling async operations
- Build debugging tools for identifying and preventing memory leaks

## Background

Memory leaks are a critical issue in long-running React applications that can severely impact performance and user experience. Staff-level engineers must understand how to identify, prevent, and debug memory leaks in production applications.

This exercise covers the most common memory leak patterns and their solutions:

1. **Event Listeners** - Not cleaned up on unmount
2. **Timers/Intervals** - setInterval/setTimeout not cleared
3. **Subscriptions** - External subscriptions not unsubscribed
4. **DOM References** - Holding references to unmounted DOM nodes
5. **Closure References** - Closures holding references to large objects
6. **Async Operations** - Fetch requests not canceled

## Key Concepts

### Memory Monitoring with Performance API
```typescript
const memoryInfo = (performance as any).memory;
const stats = {
  usedJSHeapSize: memoryInfo.usedJSHeapSize,
  totalJSHeapSize: memoryInfo.totalJSHeapSize,
  jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit,
};
```

### AbortController for Cleanup
```typescript
const abortController = new AbortController();
fetch('/api/data', { signal: abortController.signal });

// Cleanup
useEffect(() => () => abortController.abort(), []);
```

### WeakMap for Automatic Cleanup
```typescript
const objectMetadata = new WeakMap();
objectMetadata.set(someObject, { data: 'metadata' });
// Automatically cleaned up when someObject is garbage collected
```

### Event Listener Cleanup
```typescript
useEffect(() => {
  const handler = (e) => console.log(e);
  document.addEventListener('scroll', handler);
  return () => document.removeEventListener('scroll', handler);
}, []);
```

## Exercise Tasks

### 1. Memory Monitoring Utility (20 minutes)

Implement `useMemoryMonitor` hook that tracks:
- Current heap usage with `performance.memory` API
- Peak memory usage during session
- Memory usage samples over time
- Leak detection based on memory growth patterns
- Memory usage alerts and thresholds

```typescript
function useMemoryMonitor() {
  // Track memory over time
  // Detect unusual growth patterns
  // Provide real-time statistics
  // Alert on potential leaks
}
```

### 2. Memory Profiler for Components (15 minutes)

Create `useMemoryProfiler` hook for component-specific profiling:
- Track memory before/after component mount/unmount
- Measure memory impact of component lifecycle
- Verify cleanup effectiveness
- Generate profiling reports

### 3. Intentionally Leaky Component (25 minutes)

Implement `LeakyComponent` that demonstrates common leak patterns:
- **Event Listener Leak**: Add event listeners without cleanup
- **Interval Leak**: setInterval without clearInterval
- **Subscription Leak**: Subscribe to external services without cleanup
- **DOM Reference Leak**: Hold references to DOM nodes
- **Closure Leak**: Closures holding large object references

**Toggle Behavior**: Component should leak when `enableLeaks=true` and cleanup properly when `enableLeaks=false`

### 4. Proper Cleanup Examples (20 minutes)

Create `CleanupExample` component demonstrating:
- **AbortController**: Cancel fetch requests on unmount
- **Event Listeners**: Proper addEventListener/removeEventListener
- **Subscriptions**: Subscribe/unsubscribe patterns
- **Timers**: setInterval with clearInterval cleanup
- **Ref Cleanup**: Clear refs that hold DOM references

### 5. WeakMap Usage Patterns (10 minutes)

Implement `ObjectRegistry` class using WeakMap:
- Associate metadata with objects without preventing garbage collection
- Demonstrate automatic cleanup when objects are dereferenced
- Show advantages over regular Map for object associations

## Advanced Challenges

### Memory Leak Detection Algorithm
Implement sophisticated leak detection:
- Track memory usage patterns over time
- Identify memory that grows but never decreases
- Detect retained DOM nodes after component unmount
- Monitor event listener counts
- Alert on suspicious memory growth patterns

### Production Debugging Tools
Create tools suitable for production use:
- Memory usage sampling with configurable intervals
- Leak reports with actionable insights
- Performance impact measurement
- Memory optimization recommendations

### Real-world Scenarios
Handle common production issues:
- Large dataset rendering without memory explosion
- WebSocket connections with proper cleanup
- File upload/download with memory management
- Third-party library integration cleanup

## Testing Your Implementation

Your solution should demonstrate:

1. **Clear Memory Patterns**: Visible difference between leaky and clean behavior
2. **Effective Monitoring**: Real-time memory statistics and leak detection
3. **Proper Cleanup**: All resources cleaned up on component unmount
4. **WeakMap Usage**: Automatic garbage collection of associated metadata
5. **Production Ready**: Tools suitable for debugging production issues

## Success Criteria

- [ ] `useMemoryMonitor` tracks heap usage and detects leaks
- [ ] `useMemoryProfiler` measures component memory impact
- [ ] `LeakyComponent` demonstrates 5+ types of memory leaks
- [ ] `CleanupExample` shows proper cleanup for all resource types
- [ ] `ObjectRegistry` uses WeakMap for automatic cleanup
- [ ] Memory monitoring dashboard displays real-time statistics
- [ ] Leak detector identifies and reports memory issues
- [ ] Toggle between leaky and clean behavior works correctly

## Common Memory Leak Patterns

### Event Listeners
```typescript
// ❌ Leak
useEffect(() => {
  document.addEventListener('scroll', handler);
  // Missing cleanup
}, []);

// ✅ Clean
useEffect(() => {
  document.addEventListener('scroll', handler);
  return () => document.removeEventListener('scroll', handler);
}, []);
```

### Intervals/Timeouts
```typescript
// ❌ Leak
useEffect(() => {
  setInterval(() => updateData(), 1000);
  // Missing cleanup
}, []);

// ✅ Clean
useEffect(() => {
  const interval = setInterval(() => updateData(), 1000);
  return () => clearInterval(interval);
}, []);
```

### Async Operations
```typescript
// ❌ Leak
useEffect(() => {
  fetch('/api/data').then(setData);
  // Can't cancel
}, []);

// ✅ Clean
useEffect(() => {
  const controller = new AbortController();
  fetch('/api/data', { signal: controller.signal }).then(setData);
  return () => controller.abort();
}, []);
```

## Debugging Tools & Techniques

### Browser DevTools
1. **Memory Tab**: Heap snapshots and allocation timelines
2. **Performance Tab**: Memory usage during recordings
3. **Console**: `performance.memory` for runtime monitoring

### Memory Profiling Workflow
1. Take baseline heap snapshot
2. Perform user actions
3. Force garbage collection (DevTools > Memory > Collect Garbage)
4. Take another snapshot
5. Compare snapshots to identify retained objects

### Production Monitoring
```typescript
// Sample memory every 30 seconds
setInterval(() => {
  if ((performance as any).memory) {
    const memory = (performance as any).memory;
    console.log(`Memory: ${memory.usedJSHeapSize / 1024 / 1024}MB`);
  }
}, 30000);
```

## Real-world Application

These patterns are essential for:
- Long-running single-page applications
- Applications with frequent component mounting/unmounting
- WebRTC applications with media streams
- Real-time applications with WebSocket connections
- Applications handling large datasets
- Mobile web applications with memory constraints

Remember: Prevention is better than detection. Design components with cleanup in mind from the beginning rather than trying to fix leaks later.