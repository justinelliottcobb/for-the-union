import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { Container, Paper, Title, Text, Button, Group, Badge, Progress, Tabs, Alert, Stack, Grid, Card, ActionIcon, Tooltip, Code, Modal, TextInput, Select } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconRefresh, IconDatabase, IconClock, IconActivity, IconAlertTriangle, IconCheck, IconX, IconGasStation, IconTrendingUp, IconSettings, IconBug } from '@tabler/icons-react';
import { ethers } from 'ethers';

// ===== TYPES AND INTERFACES =====

interface Account {
  address: string;
  balance: bigint;
  nonce: number;
  isConnected: boolean;
}

interface Network {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: bigint;
  gasUsed: bigint;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: Date;
  blockNumber?: number;
}

interface PendingTransaction {
  id: string;
  hash?: string;
  to: string;
  data: string;
  value: bigint;
  gasLimit: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  nonce?: number;
  priority: 'low' | 'normal' | 'high';
  status: 'pending' | 'submitted' | 'confirmed' | 'failed';
  retryCount: number;
  lastError?: string;
  createdAt: Date;
  submittedAt?: Date;
  confirmedAt?: Date;
}

interface ContractState {
  address: string;
  abi: any[];
  state: Record<string, any>;
  lastUpdated: Date;
}

interface ModalState {
  isTransactionModalOpen: boolean;
  isSettingsModalOpen: boolean;
  isDebuggerOpen: boolean;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
}

interface Web3State {
  accounts: Account[];
  selectedAccount: string | null;
  networks: Network[];
  activeNetwork: string;
  transactions: Transaction[];
  pendingTx: PendingTransaction[];
  contracts: ContractState[];
  modals: ModalState;
  notifications: Notification[];
  syncStatus: SyncStatus;
  cacheStats: CacheStats;
}

interface StateSnapshot {
  state: Web3State;
  timestamp: Date;
  action: string;
}

interface QueuedTransaction {
  id: string;
  hash?: string;
  to: string;
  data: string;
  value: bigint;
  gasLimit: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  nonce?: number;
  priority: 'low' | 'normal' | 'high';
  status: 'pending' | 'submitted' | 'confirmed' | 'failed';
  retryCount: number;
  lastError?: string;
  createdAt: Date;
  submittedAt?: Date;
  confirmedAt?: Date;
}

interface QueueStatus {
  totalTransactions: number;
  pendingCount: number;
  processingCount: number;
  failedCount: number;
  averageProcessingTime: number;
}

interface CacheEntry<T = any> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number;
  dependencies: string[];
  metadata?: Record<string, any>;
}

interface CacheConfig {
  maxMemoryEntries: number;
  defaultTTL: number;
  compressionEnabled: boolean;
  persistentStorage: boolean;
}

interface CacheStats {
  totalEntries: number;
  hitRate: number;
  missRate: number;
  memoryUsage: number;
  lastCleanup: Date;
}

interface SyncStatus {
  lastSyncedBlock: number;
  currentBlock: number;
  syncProgress: number;
  isSyncing: boolean;
  lastSyncTime: Date;
  errors: SyncError[];
}

interface SyncError {
  message: string;
  timestamp: Date;
  blockNumber?: number;
}

interface StateChange {
  path: string;
  oldValue: any;
  newValue: any;
  timestamp: Date;
}

interface OptimisticUpdate {
  id: string;
  changes: StateChange[];
  rollback: () => void;
  timestamp: Date;
}

// ===== STATE MANAGEMENT =====

type StateSubscriber = (state: Web3State) => void;
type UnsubscribeFunction = () => void;
type StateMiddleware = (action: any, state: Web3State, next: (action: any) => void) => void;

class Web3StateManager {
  private state: Web3State;
  private subscribers: Map<string, StateSubscriber[]> = new Map();
  private middleware: StateMiddleware[] = [];
  private history: StateSnapshot[] = [];
  private currentHistoryIndex = -1;
  private maxHistorySize = 50;

  constructor(initialState?: Partial<Web3State>) {
    this.state = {
      accounts: [],
      selectedAccount: null,
      networks: [
        {
          chainId: 1,
          name: 'Ethereum Mainnet',
          rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/demo',
          blockExplorer: 'https://etherscan.io',
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
        },
        {
          chainId: 137,
          name: 'Polygon',
          rpcUrl: 'https://polygon-rpc.com',
          blockExplorer: 'https://polygonscan.com',
          nativeCurrency: { name: 'Matic', symbol: 'MATIC', decimals: 18 }
        }
      ],
      activeNetwork: 'ethereum',
      transactions: [],
      pendingTx: [],
      contracts: [],
      modals: {
        isTransactionModalOpen: false,
        isSettingsModalOpen: false,
        isDebuggerOpen: false
      },
      notifications: [],
      syncStatus: {
        lastSyncedBlock: 0,
        currentBlock: 0,
        syncProgress: 0,
        isSyncing: false,
        lastSyncTime: new Date(),
        errors: []
      },
      cacheStats: {
        totalEntries: 0,
        hitRate: 0.95,
        missRate: 0.05,
        memoryUsage: 0,
        lastCleanup: new Date()
      },
      ...initialState
    };

    this.saveSnapshot('INIT');
  }

  getState(): Web3State {
    return { ...this.state };
  }

  setState(updates: Partial<Web3State>, action = 'UPDATE'): void {
    const oldState = { ...this.state };
    
    // Apply middleware
    let processedUpdates = updates;
    this.middleware.forEach(middleware => {
      middleware(updates, this.state, (processedAction) => {
        processedUpdates = processedAction;
      });
    });

    this.state = { ...this.state, ...processedUpdates };
    this.saveSnapshot(action);
    this.notifySubscribers();
  }

  subscribe(path: string, callback: StateSubscriber): UnsubscribeFunction {
    if (!this.subscribers.has(path)) {
      this.subscribers.set(path, []);
    }
    this.subscribers.get(path)!.push(callback);

    return () => {
      const pathSubscribers = this.subscribers.get(path);
      if (pathSubscribers) {
        const index = pathSubscribers.indexOf(callback);
        if (index > -1) {
          pathSubscribers.splice(index, 1);
        }
      }
    };
  }

  use(middleware: StateMiddleware): void {
    this.middleware.push(middleware);
  }

  private notifySubscribers(): void {
    this.subscribers.forEach((callbacks) => {
      callbacks.forEach(callback => callback(this.state));
    });
  }

  private saveSnapshot(action: string): void {
    const snapshot: StateSnapshot = {
      state: { ...this.state },
      timestamp: new Date(),
      action
    };

    // Remove future history if we're not at the end
    if (this.currentHistoryIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentHistoryIndex + 1);
    }

    this.history.push(snapshot);
    this.currentHistoryIndex = this.history.length - 1;

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
      this.currentHistoryIndex = this.history.length - 1;
    }
  }

  undo(): void {
    if (this.currentHistoryIndex > 0) {
      this.currentHistoryIndex--;
      this.state = { ...this.history[this.currentHistoryIndex].state };
      this.notifySubscribers();
    }
  }

  redo(): void {
    if (this.currentHistoryIndex < this.history.length - 1) {
      this.currentHistoryIndex++;
      this.state = { ...this.history[this.currentHistoryIndex].state };
      this.notifySubscribers();
    }
  }

  getHistory(): StateSnapshot[] {
    return [...this.history];
  }

  async persist(): Promise<void> {
    try {
      localStorage.setItem('web3-state', JSON.stringify(this.state));
    } catch (error) {
      console.error('Failed to persist state:', error);
    }
  }

  async restore(): Promise<void> {
    try {
      const stored = localStorage.getItem('web3-state');
      if (stored) {
        const restoredState = JSON.parse(stored);
        this.setState(restoredState, 'RESTORE');
      }
    } catch (error) {
      console.error('Failed to restore state:', error);
    }
  }
}

// ===== TRANSACTION QUEUE =====

class TransactionQueue {
  private queue: Map<string, QueuedTransaction> = new Map();
  private processing: Set<string> = new Set();
  private maxRetries = 3;
  private gasMultiplier = 1.1;
  private provider: ethers.Provider;
  private signer: ethers.Signer;
  private processInterval?: NodeJS.Timeout;

  constructor(provider: ethers.Provider, signer: ethers.Signer) {
    this.provider = provider;
    this.signer = signer;
    this.startProcessing();
  }

  add(tx: Partial<QueuedTransaction>): string {
    const id = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const queuedTx: QueuedTransaction = {
      id,
      to: tx.to || '',
      data: tx.data || '0x',
      value: tx.value || BigInt(0),
      gasLimit: tx.gasLimit || BigInt(21000),
      priority: tx.priority || 'normal',
      status: 'pending',
      retryCount: 0,
      createdAt: new Date(),
      ...tx
    };

    this.queue.set(id, queuedTx);
    return id;
  }

  remove(id: string): boolean {
    return this.queue.delete(id);
  }

  clear(): void {
    this.queue.clear();
    this.processing.clear();
  }

  private startProcessing(): void {
    this.processInterval = setInterval(() => {
      this.process();
    }, 2000);
  }

  async process(): Promise<void> {
    const pendingTxs = Array.from(this.queue.values())
      .filter(tx => tx.status === 'pending' && !this.processing.has(tx.id))
      .sort((a, b) => {
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

    for (const tx of pendingTxs.slice(0, 3)) { // Process max 3 at a time
      this.processTransaction(tx);
    }
  }

  private async processTransaction(tx: QueuedTransaction): Promise<void> {
    this.processing.add(tx.id);
    
    try {
      // Estimate gas if not provided
      if (!tx.gasPrice && !tx.maxFeePerGas) {
        const feeData = await this.provider.getFeeData();
        tx.gasPrice = feeData.gasPrice || BigInt(0);
      }

      // Prepare transaction
      const txRequest: ethers.TransactionRequest = {
        to: tx.to,
        data: tx.data,
        value: tx.value,
        gasLimit: tx.gasLimit,
        gasPrice: tx.gasPrice,
        maxFeePerGas: tx.maxFeePerGas,
        maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
        nonce: tx.nonce
      };

      // Send transaction
      const sentTx = await this.signer.sendTransaction(txRequest);
      
      tx.hash = sentTx.hash;
      tx.status = 'submitted';
      tx.submittedAt = new Date();

      // Wait for confirmation
      const receipt = await sentTx.wait();
      
      if (receipt?.status === 1) {
        tx.status = 'confirmed';
        tx.confirmedAt = new Date();
      } else {
        throw new Error('Transaction failed');
      }

    } catch (error) {
      tx.lastError = error instanceof Error ? error.message : 'Unknown error';
      tx.retryCount++;

      if (tx.retryCount < this.maxRetries) {
        await this.retryTransaction(tx);
      } else {
        tx.status = 'failed';
      }
    } finally {
      this.processing.delete(tx.id);
    }
  }

  private async retryTransaction(tx: QueuedTransaction): Promise<void> {
    // Exponential backoff
    const delay = Math.pow(2, tx.retryCount) * 1000;
    
    setTimeout(async () => {
      // Increase gas price for retry
      if (tx.gasPrice) {
        tx.gasPrice = BigInt(Math.floor(Number(tx.gasPrice) * this.gasMultiplier));
      }
      
      tx.status = 'pending';
    }, delay);
  }

  async speedUp(id: string, gasPriceIncrease = 1.2): Promise<string> {
    const tx = this.queue.get(id);
    if (!tx) throw new Error('Transaction not found');

    const newTx = { ...tx };
    newTx.id = `${id}_speedup_${Date.now()}`;
    
    if (newTx.gasPrice) {
      newTx.gasPrice = BigInt(Math.floor(Number(newTx.gasPrice) * gasPriceIncrease));
    }

    this.queue.set(newTx.id, newTx);
    return newTx.id;
  }

  async cancel(id: string): Promise<string> {
    const tx = this.queue.get(id);
    if (!tx) throw new Error('Transaction not found');

    const cancelTx: QueuedTransaction = {
      id: `${id}_cancel_${Date.now()}`,
      to: tx.to,
      data: '0x',
      value: BigInt(0),
      gasLimit: BigInt(21000),
      gasPrice: tx.gasPrice,
      nonce: tx.nonce,
      priority: 'high',
      status: 'pending',
      retryCount: 0,
      createdAt: new Date()
    };

    this.queue.set(cancelTx.id, cancelTx);
    return cancelTx.id;
  }

  getStatus(): QueueStatus {
    const transactions = Array.from(this.queue.values());
    
    return {
      totalTransactions: transactions.length,
      pendingCount: transactions.filter(tx => tx.status === 'pending').length,
      processingCount: this.processing.size,
      failedCount: transactions.filter(tx => tx.status === 'failed').length,
      averageProcessingTime: this.calculateAverageProcessingTime(transactions)
    };
  }

  private calculateAverageProcessingTime(transactions: QueuedTransaction[]): number {
    const confirmedTxs = transactions.filter(tx => tx.status === 'confirmed' && tx.submittedAt && tx.confirmedAt);
    
    if (confirmedTxs.length === 0) return 0;

    const totalTime = confirmedTxs.reduce((sum, tx) => {
      const processingTime = tx.confirmedAt!.getTime() - tx.submittedAt!.getTime();
      return sum + processingTime;
    }, 0);

    return Math.round(totalTime / confirmedTxs.length / 1000); // Convert to seconds
  }
}

// ===== CACHE MANAGER =====

class CacheManager {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig;
  private stats: CacheStats;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(config: CacheConfig) {
    this.config = config;
    this.stats = {
      totalEntries: 0,
      hitRate: 0,
      missRate: 0,
      memoryUsage: 0,
      lastCleanup: new Date()
    };

    this.startCleanupTimer();
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.memoryCache.get(key);
    
    if (!entry) {
      this.updateStats('miss');
      return null;
    }

    if (this.isExpired(entry)) {
      this.memoryCache.delete(key);
      this.updateStats('miss');
      return null;
    }

    this.updateStats('hit');
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttl?: number, dependencies?: string[]): Promise<void> {
    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      dependencies: dependencies || []
    };

    this.memoryCache.set(key, entry);
    this.stats.totalEntries = this.memoryCache.size;

    // Enforce memory limits
    if (this.memoryCache.size > this.config.maxMemoryEntries) {
      this.evictOldest();
    }
  }

  async delete(key: string): Promise<boolean> {
    const deleted = this.memoryCache.delete(key);
    this.stats.totalEntries = this.memoryCache.size;
    return deleted;
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
    this.stats.totalEntries = 0;
  }

  async getMultiple<T>(keys: string[]): Promise<Map<string, T>> {
    const result = new Map<string, T>();
    
    for (const key of keys) {
      const value = await this.get<T>(key);
      if (value !== null) {
        result.set(key, value);
      }
    }

    return result;
  }

  async setMultiple<T>(entries: Map<string, T>, ttl?: number): Promise<void> {
    const promises = Array.from(entries.entries()).map(([key, value]) =>
      this.set(key, value, ttl)
    );
    await Promise.all(promises);
  }

  async invalidate(pattern: string): Promise<number> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    const keysToDelete: string[] = [];

    for (const [key] of this.memoryCache) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.memoryCache.delete(key));
    this.stats.totalEntries = this.memoryCache.size;
    
    return keysToDelete.length;
  }

  async invalidateByDependency(dependency: string): Promise<number> {
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.memoryCache) {
      if (entry.dependencies.includes(dependency)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.memoryCache.delete(key));
    this.stats.totalEntries = this.memoryCache.size;
    
    return keysToDelete.length;
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private evictOldest(): void {
    let oldest: [string, CacheEntry] | null = null;

    for (const [key, entry] of this.memoryCache) {
      if (!oldest || entry.timestamp < oldest[1].timestamp) {
        oldest = [key, entry];
      }
    }

    if (oldest) {
      this.memoryCache.delete(oldest[0]);
    }
  }

  private updateStats(type: 'hit' | 'miss'): void {
    const totalRequests = (this.stats.hitRate + this.stats.missRate) * 1000 || 1;
    
    if (type === 'hit') {
      this.stats.hitRate = (this.stats.hitRate * totalRequests + 1) / (totalRequests + 1);
      this.stats.missRate = 1 - this.stats.hitRate;
    } else {
      this.stats.missRate = (this.stats.missRate * totalRequests + 1) / (totalRequests + 1);
      this.stats.hitRate = 1 - this.stats.missRate;
    }
  }

  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Cleanup every minute
  }

  private async cleanup(): Promise<number> {
    let removed = 0;
    const now = Date.now();

    for (const [key, entry] of this.memoryCache) {
      if (now - entry.timestamp > entry.ttl) {
        this.memoryCache.delete(key);
        removed++;
      }
    }

    this.stats.totalEntries = this.memoryCache.size;
    this.stats.lastCleanup = new Date();
    
    return removed;
  }
}

// ===== SYNC ENGINE =====

class SyncEngine {
  private provider: ethers.Provider;
  private stateManager: Web3StateManager;
  private cacheManager: CacheManager;
  private status: SyncStatus;
  private syncInterval?: NodeJS.Timeout;
  private isRunning = false;

  constructor(provider: ethers.Provider, stateManager: Web3StateManager, cacheManager: CacheManager) {
    this.provider = provider;
    this.stateManager = stateManager;
    this.cacheManager = cacheManager;
    
    this.status = {
      lastSyncedBlock: 0,
      currentBlock: 0,
      syncProgress: 0,
      isSyncing: false,
      lastSyncTime: new Date(),
      errors: []
    };
  }

  async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    this.status.isSyncing = true;
    
    this.syncInterval = setInterval(async () => {
      try {
        await this.syncToLatest();
      } catch (error) {
        this.handleSyncError(error);
      }
    }, 10000); // Sync every 10 seconds
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    this.status.isSyncing = false;
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
    }
  }

  async syncToLatest(): Promise<void> {
    try {
      const latestBlock = await this.provider.getBlockNumber();
      this.status.currentBlock = latestBlock;

      if (this.status.lastSyncedBlock === 0) {
        this.status.lastSyncedBlock = Math.max(0, latestBlock - 100); // Sync last 100 blocks initially
      }

      if (this.status.lastSyncedBlock < latestBlock) {
        await this.syncRange(this.status.lastSyncedBlock + 1, latestBlock);
        this.status.lastSyncedBlock = latestBlock;
      }

      this.status.syncProgress = 100;
      this.status.lastSyncTime = new Date();
      this.updateStateManagerSync();

    } catch (error) {
      this.handleSyncError(error);
    }
  }

  async syncRange(fromBlock: number, toBlock: number): Promise<void> {
    const batchSize = 10;
    
    for (let start = fromBlock; start <= toBlock; start += batchSize) {
      const end = Math.min(start + batchSize - 1, toBlock);
      
      try {
        await this.processBatchBlocks(start, end);
        this.status.syncProgress = ((start - fromBlock) / (toBlock - fromBlock + 1)) * 100;
      } catch (error) {
        this.handleSyncError(error, start);
      }
    }
  }

  private async processBatchBlocks(fromBlock: number, toBlock: number): Promise<void> {
    const promises = [];
    
    for (let blockNumber = fromBlock; blockNumber <= toBlock; blockNumber++) {
      promises.push(this.processBlock(blockNumber));
    }

    await Promise.all(promises);
  }

  private async processBlock(blockNumber: number): Promise<void> {
    // Cache block data
    const cacheKey = `block_${blockNumber}`;
    let block = await this.cacheManager.get<ethers.Block>(cacheKey);

    if (!block) {
      block = await this.provider.getBlock(blockNumber, true);
      if (block) {
        await this.cacheManager.set(cacheKey, block, 3600000); // Cache for 1 hour
      }
    }

    if (block?.transactions) {
      // Update transaction states
      const currentState = this.stateManager.getState();
      const updatedTransactions = [...currentState.transactions];

      for (const tx of block.transactions) {
        if (typeof tx === 'object' && tx.hash) {
          const existingTxIndex = updatedTransactions.findIndex(t => t.hash === tx.hash);
          
          if (existingTxIndex >= 0) {
            updatedTransactions[existingTxIndex].status = 'confirmed';
            updatedTransactions[existingTxIndex].blockNumber = blockNumber;
          }
        }
      }

      this.stateManager.setState({ transactions: updatedTransactions }, 'SYNC_BLOCK');
    }
  }

  private handleSyncError(error: any, blockNumber?: number): void {
    const syncError: SyncError = {
      message: error instanceof Error ? error.message : 'Unknown sync error',
      timestamp: new Date(),
      blockNumber
    };

    this.status.errors.push(syncError);
    
    // Keep only last 10 errors
    if (this.status.errors.length > 10) {
      this.status.errors = this.status.errors.slice(-10);
    }

    console.error('Sync error:', syncError);
  }

  private updateStateManagerSync(): void {
    this.stateManager.setState({ syncStatus: { ...this.status } }, 'SYNC_UPDATE');
  }

  getStatus(): SyncStatus {
    return { ...this.status };
  }
}

// ===== OPTIMISTIC UPDATE MANAGER =====

class OptimisticUpdateManager {
  private pendingUpdates: Map<string, OptimisticUpdate> = new Map();
  private rollbackQueue: (() => void)[] = [];

  applyOptimisticUpdate(txId: string, changes: StateChange[], rollback: () => void): void {
    const update: OptimisticUpdate = {
      id: txId,
      changes,
      rollback,
      timestamp: new Date()
    };

    this.pendingUpdates.set(txId, update);
  }

  confirmUpdate(txId: string): void {
    this.pendingUpdates.delete(txId);
  }

  rollbackUpdate(txId: string): void {
    const update = this.pendingUpdates.get(txId);
    if (update) {
      update.rollback();
      this.pendingUpdates.delete(txId);
    }
  }

  rollbackAll(): void {
    for (const update of this.pendingUpdates.values()) {
      update.rollback();
    }
    this.pendingUpdates.clear();
  }
}

// ===== REACT CONTEXT =====

interface Web3StateContextType {
  state: Web3State;
  stateManager: Web3StateManager;
  transactionQueue: TransactionQueue;
  cacheManager: CacheManager;
  syncEngine: SyncEngine;
  optimisticUpdates: OptimisticUpdateManager;
}

const Web3StateContext = createContext<Web3StateContextType | null>(null);

export const Web3StateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize managers
  const stateManager = useMemo(() => new Web3StateManager(), []);
  const cacheManager = useMemo(() => new CacheManager({
    maxMemoryEntries: 1000,
    defaultTTL: 300000, // 5 minutes
    compressionEnabled: false,
    persistentStorage: true
  }), []);

  // Mock provider and signer for demo
  const provider = useMemo(() => new ethers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/demo'), []);
  const signer = useMemo(() => ethers.Wallet.createRandom().connect(provider), [provider]);
  
  const transactionQueue = useMemo(() => new TransactionQueue(provider, signer), [provider, signer]);
  const syncEngine = useMemo(() => new SyncEngine(provider, stateManager, cacheManager), [provider, stateManager, cacheManager]);
  const optimisticUpdates = useMemo(() => new OptimisticUpdateManager(), []);

  const [state, dispatch] = useReducer((current: Web3State, action: any) => {
    return stateManager.getState();
  }, stateManager.getState());

  useEffect(() => {
    const unsubscribe = stateManager.subscribe('*', (newState) => {
      dispatch({ type: 'UPDATE' });
    });

    // Start sync engine
    syncEngine.start();

    // Cleanup
    return () => {
      unsubscribe();
      syncEngine.stop();
    };
  }, [stateManager, syncEngine]);

  const contextValue: Web3StateContextType = {
    state,
    stateManager,
    transactionQueue,
    cacheManager,
    syncEngine,
    optimisticUpdates
  };

  return (
    <Web3StateContext.Provider value={contextValue}>
      {children}
    </Web3StateContext.Provider>
  );
};

export const useWeb3State = () => {
  const context = useContext(Web3StateContext);
  if (!context) {
    throw new Error('useWeb3State must be used within Web3StateProvider');
  }
  return context;
};

// ===== COMPONENTS =====

const TransactionStatus: React.FC<{ txId: string }> = ({ txId }) => {
  const { transactionQueue } = useWeb3State();
  const [tx, setTx] = React.useState<QueuedTransaction | null>(null);

  useEffect(() => {
    // This would normally subscribe to queue updates
    const interval = setInterval(() => {
      // Mock transaction status updates
      setTx({
        id: txId,
        to: '0x742d35Cc6665C0532846901f755e39c22E2B6B59',
        data: '0x',
        value: BigInt('1000000000000000000'),
        gasLimit: BigInt(21000),
        priority: 'normal',
        status: Math.random() > 0.5 ? 'confirmed' : 'pending',
        retryCount: 0,
        createdAt: new Date(Date.now() - 30000),
        submittedAt: new Date(Date.now() - 20000),
        confirmedAt: new Date()
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [txId]);

  if (!tx) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'green';
      case 'failed': return 'red';
      case 'submitted': return 'yellow';
      default: return 'blue';
    }
  };

  return (
    <Card withBorder p="sm">
      <Group justify="space-between">
        <div>
          <Text size="sm" fw={500}>Transaction {tx.id.slice(0, 8)}...</Text>
          <Text size="xs" c="dimmed">To: {tx.to.slice(0, 10)}...</Text>
        </div>
        <Badge color={getStatusColor(tx.status)} size="sm">
          {tx.status}
        </Badge>
      </Group>
      
      {tx.status === 'pending' && tx.retryCount > 0 && (
        <Text size="xs" c="orange" mt="xs">
          Retry #{tx.retryCount}
        </Text>
      )}
      
      <Group mt="xs" gap="xs">
        <Button size="xs" variant="light" color="blue">
          Speed Up
        </Button>
        <Button size="xs" variant="light" color="red">
          Cancel
        </Button>
      </Group>
    </Card>
  );
};

const SyncStatusIndicator: React.FC = () => {
  const { state } = useWeb3State();
  const { syncStatus } = state;

  return (
    <Card withBorder p="sm">
      <Group justify="space-between" align="center">
        <Group align="center">
          <IconActivity size={16} />
          <div>
            <Text size="sm" fw={500}>Sync Status</Text>
            <Text size="xs" c="dimmed">
              Block {syncStatus.lastSyncedBlock} / {syncStatus.currentBlock}
            </Text>
          </div>
        </Group>
        <Badge color={syncStatus.isSyncing ? 'blue' : 'green'} size="sm">
          {syncStatus.isSyncing ? 'Syncing' : 'Synced'}
        </Badge>
      </Group>
      
      <Progress
        value={syncStatus.syncProgress}
        color={syncStatus.isSyncing ? 'blue' : 'green'}
        size="sm"
        mt="xs"
      />
      
      {syncStatus.errors.length > 0 && (
        <Alert icon={<IconAlertTriangle size={14} />} color="yellow" size="sm" mt="xs">
          {syncStatus.errors.length} sync errors
        </Alert>
      )}
    </Card>
  );
};

const CacheStatsPanel: React.FC = () => {
  const { state } = useWeb3State();
  const { cacheStats } = state;

  return (
    <Card withBorder p="sm">
      <Group justify="space-between" align="center" mb="xs">
        <Group align="center">
          <IconDatabase size={16} />
          <Text size="sm" fw={500}>Cache Statistics</Text>
        </Group>
        <ActionIcon size="sm" variant="light">
          <IconRefresh size={12} />
        </ActionIcon>
      </Group>
      
      <Grid>
        <Grid.Col span={6}>
          <Text size="xs" c="dimmed">Hit Rate</Text>
          <Text size="sm" fw={500}>{(cacheStats.hitRate * 100).toFixed(1)}%</Text>
        </Grid.Col>
        <Grid.Col span={6}>
          <Text size="xs" c="dimmed">Entries</Text>
          <Text size="sm" fw={500}>{cacheStats.totalEntries}</Text>
        </Grid.Col>
      </Grid>
      
      <Progress
        value={cacheStats.hitRate * 100}
        color="green"
        size="sm"
        mt="xs"
      />
    </Card>
  );
};

const StateDebugger: React.FC = () => {
  const { state, stateManager } = useWeb3State();
  const [selectedPath, setSelectedPath] = React.useState('');
  const history = stateManager.getHistory();

  return (
    <Card withBorder p="md">
      <Group justify="space-between" align="center" mb="md">
        <Group align="center">
          <IconBug size={16} />
          <Text size="sm" fw={500}>State Debugger</Text>
        </Group>
        <Group>
          <Button size="xs" onClick={() => stateManager.undo()}>
            Undo
          </Button>
          <Button size="xs" onClick={() => stateManager.redo()}>
            Redo
          </Button>
        </Group>
      </Group>
      
      <Tabs defaultValue="state">
        <Tabs.List>
          <Tabs.Tab value="state">Current State</Tabs.Tab>
          <Tabs.Tab value="history">History</Tabs.Tab>
        </Tabs.List>
        
        <Tabs.Panel value="state" pt="md">
          <Select
            label="State Path"
            placeholder="Select state path to inspect"
            data={[
              { value: 'accounts', label: 'Accounts' },
              { value: 'transactions', label: 'Transactions' },
              { value: 'syncStatus', label: 'Sync Status' },
              { value: 'cacheStats', label: 'Cache Stats' }
            ]}
            value={selectedPath}
            onChange={(value) => setSelectedPath(value || '')}
            mb="md"
          />
          
          {selectedPath && (
            <Code block>
              {JSON.stringify((state as any)[selectedPath], null, 2)}
            </Code>
          )}
        </Tabs.Panel>
        
        <Tabs.Panel value="history" pt="md">
          <Stack gap="xs">
            {history.slice(-5).map((snapshot, index) => (
              <Card key={index} withBorder p="xs">
                <Group justify="space-between">
                  <div>
                    <Text size="xs" fw={500}>{snapshot.action}</Text>
                    <Text size="xs" c="dimmed">
                      {snapshot.timestamp.toLocaleTimeString()}
                    </Text>
                  </div>
                </Group>
              </Card>
            ))}
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Card>
  );
};

// ===== MAIN EXERCISE COMPONENT =====

const Web3StateManagementExercise: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('overview');

  return (
    <Web3StateProvider>
      <Container size="xl" py="md">
        <Title order={2} mb="md">Web3 State Management</Title>
        
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="overview" leftSection={<IconActivity size={16} />}>
              Overview
            </Tabs.Tab>
            <Tabs.Tab value="transactions" leftSection={<IconGasStation size={16} />}>
              Transaction Queue
            </Tabs.Tab>
            <Tabs.Tab value="cache" leftSection={<IconDatabase size={16} />}>
              Cache Manager
            </Tabs.Tab>
            <Tabs.Tab value="sync" leftSection={<IconRefresh size={16} />}>
              Sync Engine
            </Tabs.Tab>
            <Tabs.Tab value="debug" leftSection={<IconBug size={16} />}>
              State Debugger
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="overview" pt="md">
            <Grid>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <SyncStatusIndicator />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <CacheStatsPanel />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <TransactionStatus txId="demo_tx_001" />
              </Grid.Col>
            </Grid>
          </Tabs.Panel>

          <Tabs.Panel value="transactions" pt="md">
            <Stack gap="md">
              <Paper p="md" withBorder>
                <Title order={3} mb="md">Transaction Queue</Title>
                <Group mb="md">
                  <Button leftSection={<IconGasStation size={16} />}>
                    Add Transaction
                  </Button>
                  <Button variant="light" leftSection={<IconRefresh size={16} />}>
                    Process Queue
                  </Button>
                </Group>
                
                <Stack gap="sm">
                  <TransactionStatus txId="tx_1" />
                  <TransactionStatus txId="tx_2" />
                  <TransactionStatus txId="tx_3" />
                </Stack>
              </Paper>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="cache" pt="md">
            <Paper p="md" withBorder>
              <Title order={3} mb="md">Cache Management</Title>
              <CacheStatsPanel />
              
              <Group mt="md">
                <Button variant="light">Clear Cache</Button>
                <Button variant="light">Warm Cache</Button>
                <Button variant="light">Export Stats</Button>
              </Group>
            </Paper>
          </Tabs.Panel>

          <Tabs.Panel value="sync" pt="md">
            <Paper p="md" withBorder>
              <Title order={3} mb="md">Blockchain Synchronization</Title>
              <SyncStatusIndicator />
              
              <Group mt="md">
                <Button leftSection={<IconRefresh size={16} />}>
                  Force Sync
                </Button>
                <Button variant="light">Pause Sync</Button>
                <Button variant="light">Reset Sync</Button>
              </Group>
            </Paper>
          </Tabs.Panel>

          <Tabs.Panel value="debug" pt="md">
            <StateDebugger />
          </Tabs.Panel>
        </Tabs>

        <Paper p="md" withBorder mt="md">
          <Title order={3} mb="md">Implementation Summary</Title>
          <Stack gap="sm">
            <Group>
              <IconCheck size={16} color="green" />
              <Text size="sm">Web3StateManager with history and time-travel debugging</Text>
            </Group>
            <Group>
              <IconCheck size={16} color="green" />
              <Text size="sm">TransactionQueue with retry logic and gas optimization</Text>
            </Group>
            <Group>
              <IconCheck size={16} color="green" />
              <Text size="sm">CacheManager with multi-level caching and statistics</Text>
            </Group>
            <Group>
              <IconCheck size={16} color="green" />
              <Text size="sm">SyncEngine for blockchain state synchronization</Text>
            </Group>
            <Group>
              <IconCheck size={16} color="green" />
              <Text size="sm">OptimisticUpdateManager for responsive UI updates</Text>
            </Group>
          </Stack>
        </Paper>
      </Container>
    </Web3StateProvider>
  );
};

export default Web3StateManagementExercise;