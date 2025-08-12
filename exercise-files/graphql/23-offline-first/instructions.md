# Exercise 23: Offline-first GraphQL Applications

## 🎯 Learning Objectives
- Implement cache persistence with IndexedDB for offline functionality
- Build operation queuing systems for mutations when offline
- Create conflict resolution mechanisms for competing data changes
- Master optimistic updates and background synchronization
- Develop resilient applications that work seamlessly offline and online

## 📚 Concepts Covered

### Offline-first Architecture
- **Cache Persistence**: Long-term storage of GraphQL cache data
- **Operation Queuing**: Storing mutations for later execution
- **Conflict Resolution**: Handling competing data modifications
- **Background Sync**: Automatic synchronization when connectivity returns

### Storage Strategies
- **IndexedDB**: Browser database for large data storage
- **Service Workers**: Background processing and sync capabilities
- **Local Storage**: Simple key-value storage for metadata
- **Cache API**: HTTP cache management for static resources

## 🚀 Exercise Tasks

### Part 1: Cache Persistence Setup (⭐⭐⭐)

1. **Install Dependencies**
   ```bash
   npm install apollo3-cache-persist localforage workbox-webpack-plugin
   ```

2. **Configure Cache Persistence**
   - Set up Apollo cache with proper type policies
   - Configure IndexedDB storage with LocalForage
   - Implement cache size limits and cleanup strategies
   - Add cache versioning for schema changes

3. **Initialize Persistent Cache**
   - Load cached data on application startup
   - Handle cache corruption and recovery
   - Set up cache warming strategies
   - Implement selective cache clearing

### Part 2: Operation Queue System (⭐⭐⭐⭐)

1. **Offline Mutation Queue**
   - Create queue data structure for pending mutations
   - Implement operation serialization and storage
   - Add operation deduplication and conflict detection
   - Build retry mechanisms with exponential backoff

2. **Queue Management**
   - Prioritize operations by importance and dependencies
   - Handle operation cancellation and modification
   - Implement queue persistence across app restarts
   - Add operation timeout and cleanup logic

3. **Background Processing**
   - Set up automatic queue processing when online
   - Implement batch operation execution
   - Handle partial success and error scenarios
   - Create progress tracking and user notifications

### Part 3: Conflict Resolution (⭐⭐⭐⭐⭐)

1. **Conflict Detection**
   - Identify data conflicts between local and server versions
   - Implement version vectors or timestamps for comparison
   - Create conflict classification (structural vs data conflicts)
   - Build automatic conflict detection pipelines

2. **Resolution Strategies**
   - Last-write-wins with timestamp comparison
   - Three-way merge algorithms for complex data
   - User-prompted resolution for critical conflicts
   - Field-level conflict resolution for granular control

3. **Conflict UI Components**
   - Build conflict visualization interfaces
   - Create side-by-side comparison views
   - Implement interactive merge tools
   - Add conflict history and audit trails

### Part 4: Advanced Offline Patterns (⭐⭐⭐⭐⭐)

1. **Optimistic Updates**
   - Immediate UI updates for better UX
   - Rollback mechanisms for failed operations
   - Temporary ID generation and mapping
   - State consistency during offline operations

2. **Data Synchronization**
   - Delta synchronization for large datasets
   - Incremental sync with change detection
   - Bidirectional sync with conflict resolution
   - Sync status tracking and user feedback

3. **Service Worker Integration**
   - Background sync for pending operations
   - Cache management and update strategies
   - Push notifications for sync events
   - Offline page and resource caching

## 🔧 Implementation Guide

### Cache Persistence Configuration
```typescript
import { InMemoryCache } from '@apollo/client';
import { persistCache, LocalForageWrapper } from 'apollo3-cache-persist';
import localforage from 'localforage';

const cache = new InMemoryCache({
  typePolicies: {
    User: {
      fields: {
        posts: {
          merge(existing = [], incoming, { args }) {
            // Implement smart merging for paginated data
            const merged = existing ? existing.slice() : [];
            
            if (args?.after) {
              // Append to existing data
              return [...merged, ...incoming];
            } else {
              // Replace with new data
              return incoming;
            }
          }
        }
      }
    },
    Query: {
      fields: {
        posts: offsetLimitPagination()
      }
    }
  }
});

// Configure persistence
await persistCache({
  cache,
  storage: new LocalForageWrapper(localforage),
  trigger: 'write', // Persist on every cache write
  debounce: 1000, // Debounce writes by 1 second
  maxSize: 1048576 * 50, // 50 MB limit
  serialize: true, // Use JSON serialization
});
```

### Offline Queue Implementation
```typescript
class OfflineQueue {
  private storage = localforage.createInstance({
    name: 'offline-queue'
  });

  async addOperation(operation: OfflineOperation) {
    const queue = await this.getQueue();
    const newOperation = {
      ...operation,
      id: generateId(),
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending'
    };
    
    queue.push(newOperation);
    await this.storage.setItem('operations', queue);
    
    // Try immediate execution if online
    if (navigator.onLine) {
      this.processQueue();
    }
    
    return newOperation.id;
  }

  async processQueue() {
    const queue = await this.getQueue();
    const pending = queue.filter(op => op.status === 'pending');
    
    for (const operation of pending) {
      try {
        await this.executeOperation(operation);
        await this.markAsCompleted(operation.id);
      } catch (error) {
        await this.handleOperationError(operation, error);
      }
    }
  }

  private async executeOperation(operation: OfflineOperation) {
    const { mutation, variables, optimisticResponse } = operation;
    
    return client.mutate({
      mutation,
      variables,
      optimisticResponse,
      update: (cache, { data }) => {
        // Update cache based on operation result
        this.updateCacheAfterMutation(cache, data, operation);
      }
    });
  }
}
```

### Conflict Resolution System
```typescript
interface ConflictResolution {
  strategy: 'client' | 'server' | 'merge' | 'prompt';
  resolver?: (client: any, server: any) => any;
}

class ConflictResolver {
  private resolutionStrategies: Map<string, ConflictResolution> = new Map();

  registerStrategy(type: string, resolution: ConflictResolution) {
    this.resolutionStrategies.set(type, resolution);
  }

  async resolveConflict(conflict: DataConflict): Promise<any> {
    const strategy = this.resolutionStrategies.get(conflict.type);
    
    if (!strategy) {
      throw new Error(`No resolution strategy for ${conflict.type}`);
    }

    switch (strategy.strategy) {
      case 'client':
        return conflict.clientVersion;
      
      case 'server':
        return conflict.serverVersion;
      
      case 'merge':
        return strategy.resolver?.(conflict.clientVersion, conflict.serverVersion);
      
      case 'prompt':
        return this.promptUserForResolution(conflict);
      
      default:
        throw new Error(`Unknown resolution strategy: ${strategy.strategy}`);
    }
  }

  private async promptUserForResolution(conflict: DataConflict): Promise<any> {
    return new Promise((resolve) => {
      // Show UI for user to resolve conflict
      showConflictModal({
        conflict,
        onResolve: resolve
      });
    });
  }
}

// Usage
const resolver = new ConflictResolver();

resolver.registerStrategy('User', {
  strategy: 'merge',
  resolver: (client, server) => ({
    ...server,
    ...client,
    // Keep server's system fields
    id: server.id,
    createdAt: server.createdAt,
    updatedAt: server.updatedAt
  })
});
```

## 🧪 Testing Requirements

### Offline Functionality Testing
```typescript
import { MockedProvider } from '@apollo/client/testing';

// Mock offline conditions
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: false
});

test('queues mutations when offline', async () => {
  const queue = new OfflineQueue();
  
  // Simulate offline mutation
  const operationId = await queue.addOperation({
    mutation: CREATE_POST_MUTATION,
    variables: { title: 'Offline Post', content: 'Created while offline' },
    optimisticResponse: {
      createPost: {
        id: 'temp-1',
        title: 'Offline Post',
        content: 'Created while offline',
        __typename: 'Post'
      }
    }
  });

  const operations = await queue.getQueue();
  expect(operations).toHaveLength(1);
  expect(operations[0].id).toBe(operationId);
  expect(operations[0].status).toBe('pending');
});

test('processes queue when coming online', async () => {
  const queue = new OfflineQueue();
  const executeSpy = jest.spyOn(queue, 'executeOperation');
  
  // Add operations while offline
  await queue.addOperation(mockOperation1);
  await queue.addOperation(mockOperation2);
  
  // Simulate coming online
  Object.defineProperty(navigator, 'onLine', { value: true });
  window.dispatchEvent(new Event('online'));
  
  await waitFor(() => {
    expect(executeSpy).toHaveBeenCalledTimes(2);
  });
});
```

### Conflict Resolution Testing
```typescript
test('resolves conflicts using merge strategy', async () => {
  const resolver = new ConflictResolver();
  
  resolver.registerStrategy('Post', {
    strategy: 'merge',
    resolver: (client, server) => ({
      ...server,
      title: client.title, // Prefer client title
      content: client.content // Prefer client content
    })
  });

  const conflict = {
    type: 'Post',
    clientVersion: { id: '1', title: 'Client Title', content: 'Client Content' },
    serverVersion: { id: '1', title: 'Server Title', content: 'Server Content' }
  };

  const resolved = await resolver.resolveConflict(conflict);
  
  expect(resolved.title).toBe('Client Title');
  expect(resolved.content).toBe('Client Content');
  expect(resolved.id).toBe('1');
});
```

## 🎯 Acceptance Criteria

### Core Functionality
- [ ] Apollo cache persists to IndexedDB across app restarts
- [ ] Mutations queue when offline and execute when online
- [ ] Optimistic updates work correctly with rollback on failure
- [ ] Conflict detection identifies competing data changes
- [ ] Background sync processes queued operations automatically

### Advanced Features
- [ ] Multiple conflict resolution strategies implemented
- [ ] Delta synchronization for large datasets
- [ ] Service worker integration for true background sync
- [ ] Cache size management with automatic cleanup
- [ ] Operation dependencies and execution ordering

### User Experience
- [ ] Clear offline indicators and status messages
- [ ] Conflict resolution UI for user decisions
- [ ] Progress indicators for sync operations
- [ ] Error handling with retry mechanisms
- [ ] Seamless transitions between online/offline states

### Performance
- [ ] Efficient cache serialization and deserialization
- [ ] Minimal impact on app startup time
- [ ] Optimized storage usage and cleanup
- [ ] Fast conflict detection algorithms
- [ ] Batched sync operations for better performance

## 🚀 Bonus Challenges

### Advanced Synchronization
- Implement operational transforms for collaborative editing
- Create vector clocks for distributed conflict resolution
- Build multi-device sync with cross-device conflict handling
- Add incremental backup and restore functionality

### Performance Optimization
- Implement lazy loading for large offline datasets
- Create compression algorithms for cached data
- Build intelligent prefetching based on user patterns
- Add memory-efficient streaming sync for large operations

### Enterprise Features
- Multi-tenant offline data isolation
- Encrypted offline storage for sensitive data
- Audit trails for offline operations and conflicts
- Integration with enterprise backup and sync systems

## 📖 Key Concepts to Understand

### Offline-first Philosophy
- Local-first development principles
- Eventual consistency models
- Network as an enhancement, not requirement
- User experience continuity across connectivity states

### Data Consistency Models
- Strong vs eventual consistency trade-offs
- Conflict-free replicated data types (CRDTs)
- Vector clocks and logical timestamps
- Distributed systems consistency patterns

### Storage and Sync Patterns
- Client-server synchronization protocols
- Delta sync and incremental updates
- Bidirectional sync with conflict resolution
- Bandwidth optimization strategies

---

**Estimated Time:** 105-120 minutes

**Difficulty:** ⭐⭐⭐⭐⭐ (Expert - Complex distributed systems patterns)

**Prerequisites:** 
- Advanced Apollo Client knowledge
- Browser storage APIs familiarity
- Distributed systems concepts
- Service Worker and PWA experience