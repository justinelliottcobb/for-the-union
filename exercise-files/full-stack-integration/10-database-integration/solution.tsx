import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

// Types for database integration
interface DatabaseConnection {
  id: string;
  status: 'connecting' | 'connected' | 'error' | 'disconnected';
  client: any;
  retryCount: number;
  lastError?: Error;
}

interface DatabaseContextValue {
  connection: DatabaseConnection | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isConnected: boolean;
  executeQuery: (query: string, params?: any[]) => Promise<any>;
  executeTransaction: (operations: DatabaseOperation[]) => Promise<any[]>;
}

interface DatabaseOperation {
  type: 'insert' | 'update' | 'delete' | 'select';
  table: string;
  data?: any;
  where?: any;
  select?: string[];
}

interface CacheEntry {
  data: any;
  timestamp: number;
  version: number;
  dirty: boolean;
}

// Database Context
const DatabaseContext = createContext<DatabaseContextValue | null>(null);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connection, setConnection] = useState<DatabaseConnection | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const maxRetries = 5;
  const baseDelay = 1000;

  const connect = useCallback(async () => {
    if (connection?.status === 'connecting' || connection?.status === 'connected') {
      return;
    }

    const connectionId = `conn_${Date.now()}`;
    setConnection({
      id: connectionId,
      status: 'connecting',
      client: null,
      retryCount: 0,
    });

    try {
      // Simulate database connection (replace with actual Prisma/Supabase setup)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock database client
      const mockClient = {
        query: async (sql: string, params: any[] = []) => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return { rows: [], rowCount: 0 };
        },
        transaction: async (callback: (tx: any) => Promise<any>) => {
          return await callback(mockClient);
        },
        close: async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        },
      };

      setConnection(prev => prev ? {
        ...prev,
        status: 'connected',
        client: mockClient,
        retryCount: 0,
      } : null);
    } catch (error) {
      const retryCount = (connection?.retryCount || 0) + 1;
      setConnection(prev => prev ? {
        ...prev,
        status: 'error',
        lastError: error as Error,
        retryCount,
      } : null);

      if (retryCount < maxRetries) {
        const delay = baseDelay * Math.pow(2, retryCount - 1);
        retryTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      }
    }
  }, [connection?.status, connection?.retryCount]);

  const disconnect = useCallback(async () => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    if (connection?.client) {
      await connection.client.close();
    }

    setConnection(null);
  }, [connection]);

  const executeQuery = useCallback(async (query: string, params: any[] = []) => {
    if (!connection?.client) {
      throw new Error('Database not connected');
    }

    return await connection.client.query(query, params);
  }, [connection]);

  const executeTransaction = useCallback(async (operations: DatabaseOperation[]) => {
    if (!connection?.client) {
      throw new Error('Database not connected');
    }

    return await connection.client.transaction(async (tx: any) => {
      const results = [];
      for (const op of operations) {
        const sql = buildSQL(op);
        const result = await tx.query(sql.query, sql.params);
        results.push(result);
      }
      return results;
    });
  }, [connection]);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, []);

  const contextValue: DatabaseContextValue = {
    connection,
    connect,
    disconnect,
    isConnected: connection?.status === 'connected',
    executeQuery,
    executeTransaction,
  };

  return (
    <DatabaseContext.Provider value={contextValue}>
      {children}
    </DatabaseContext.Provider>
  );
};

// Helper function to build SQL from operations
function buildSQL(operation: DatabaseOperation): { query: string; params: any[] } {
  switch (operation.type) {
    case 'select':
      const selectFields = operation.select?.join(', ') || '*';
      const whereClause = operation.where ? 
        ` WHERE ${Object.keys(operation.where).map((key, idx) => `${key} = $${idx + 1}`).join(' AND ')}` : '';
      return {
        query: `SELECT ${selectFields} FROM ${operation.table}${whereClause}`,
        params: operation.where ? Object.values(operation.where) : [],
      };
    case 'insert':
      const insertFields = Object.keys(operation.data || {});
      const insertPlaceholders = insertFields.map((_, idx) => `$${idx + 1}`).join(', ');
      return {
        query: `INSERT INTO ${operation.table} (${insertFields.join(', ')}) VALUES (${insertPlaceholders})`,
        params: Object.values(operation.data || {}),
      };
    case 'update':
      const updateFields = Object.keys(operation.data || {});
      const updateClause = updateFields.map((key, idx) => `${key} = $${idx + 1}`).join(', ');
      const updateWhereClause = operation.where ?
        ` WHERE ${Object.keys(operation.where).map((key, idx) => `${key} = $${updateFields.length + idx + 1}`).join(' AND ')}` : '';
      return {
        query: `UPDATE ${operation.table} SET ${updateClause}${updateWhereClause}`,
        params: [...Object.values(operation.data || {}), ...Object.values(operation.where || {})],
      };
    case 'delete':
      const deleteWhereClause = operation.where ?
        ` WHERE ${Object.keys(operation.where).map((key, idx) => `${key} = $${idx + 1}`).join(' AND ')}` : '';
      return {
        query: `DELETE FROM ${operation.table}${deleteWhereClause}`,
        params: Object.values(operation.where || {}),
      };
    default:
      throw new Error(`Unsupported operation type: ${operation.type}`);
  }
}

// Hook to use database context
export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within DatabaseProvider');
  }
  return context;
};

// QueryBuilder Component
export interface QueryBuilderProps {
  table: string;
  onQuery: (result: any) => void;
  onError: (error: Error) => void;
}

export const QueryBuilder: React.FC<QueryBuilderProps> = ({ table, onQuery, onError }) => {
  const { executeQuery, isConnected } = useDatabase();
  const [queryState, setQueryState] = useState({
    select: ['*'],
    where: {} as Record<string, any>,
    orderBy: '',
    limit: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const executeCurrentQuery = useCallback(async () => {
    if (!isConnected) {
      onError(new Error('Database not connected'));
      return;
    }

    setIsLoading(true);
    try {
      const operation: DatabaseOperation = {
        type: 'select',
        table,
        select: queryState.select,
        where: Object.keys(queryState.where).length > 0 ? queryState.where : undefined,
      };

      const sql = buildSQL(operation);
      let query = sql.query;

      if (queryState.orderBy) {
        query += ` ORDER BY ${queryState.orderBy}`;
      }
      if (queryState.limit) {
        query += ` LIMIT ${queryState.limit}`;
      }

      const result = await executeQuery(query, sql.params);
      onQuery(result);
    } catch (error) {
      onError(error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [table, queryState, isConnected, executeQuery, onQuery, onError]);

  const addWhereCondition = (field: string, value: any) => {
    setQueryState(prev => ({
      ...prev,
      where: { ...prev.where, [field]: value },
    }));
  };

  const removeWhereCondition = (field: string) => {
    setQueryState(prev => {
      const newWhere = { ...prev.where };
      delete newWhere[field];
      return { ...prev, where: newWhere };
    });
  };

  const setSelectFields = (fields: string[]) => {
    setQueryState(prev => ({ ...prev, select: fields }));
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
      <h4>Query Builder - {table}</h4>
      
      <div style={{ marginBottom: '10px' }}>
        <label>
          Select Fields:
          <input
            type="text"
            value={queryState.select.join(', ')}
            onChange={(e) => setSelectFields(e.target.value.split(',').map(f => f.trim()))}
            placeholder="field1, field2, ..."
            style={{ marginLeft: '5px', width: '200px' }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label>
          Where Conditions:
        </label>
        <div style={{ marginTop: '5px' }}>
          {Object.entries(queryState.where).map(([field, value]) => (
            <div key={field} style={{ marginBottom: '5px' }}>
              <span>{field} = {String(value)}</span>
              <button
                onClick={() => removeWhereCondition(field)}
                style={{ marginLeft: '10px', padding: '2px 6px' }}
              >
                Remove
              </button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
            <input
              type="text"
              placeholder="Field name"
              id="newField"
              style={{ width: '100px' }}
            />
            <input
              type="text"
              placeholder="Value"
              id="newValue"
              style={{ width: '100px' }}
            />
            <button
              onClick={() => {
                const fieldInput = document.getElementById('newField') as HTMLInputElement;
                const valueInput = document.getElementById('newValue') as HTMLInputElement;
                if (fieldInput?.value && valueInput?.value) {
                  addWhereCondition(fieldInput.value, valueInput.value);
                  fieldInput.value = '';
                  valueInput.value = '';
                }
              }}
            >
              Add Condition
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label>
          Order By:
          <input
            type="text"
            value={queryState.orderBy}
            onChange={(e) => setQueryState(prev => ({ ...prev, orderBy: e.target.value }))}
            placeholder="field ASC/DESC"
            style={{ marginLeft: '5px', width: '150px' }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label>
          Limit:
          <input
            type="number"
            value={queryState.limit}
            onChange={(e) => setQueryState(prev => ({ ...prev, limit: e.target.value }))}
            placeholder="Number of records"
            style={{ marginLeft: '5px', width: '100px' }}
          />
        </label>
      </div>

      <button
        onClick={executeCurrentQuery}
        disabled={!isConnected || isLoading}
        style={{
          padding: '8px 16px',
          backgroundColor: isConnected ? '#007bff' : '#ccc',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isConnected ? 'pointer' : 'not-allowed',
        }}
      >
        {isLoading ? 'Executing...' : 'Execute Query'}
      </button>

      <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
        Status: {isConnected ? 'Connected' : 'Disconnected'}
      </div>
    </div>
  );
};

// TransactionManager Component
export interface TransactionManagerProps {
  operations: Array<{ type: 'insert' | 'update' | 'delete'; table: string; data: any }>;
  onSuccess: (results: any[]) => void;
  onError: (error: Error) => void;
  onRollback: () => void;
}

export const TransactionManager: React.FC<TransactionManagerProps> = ({
  operations,
  onSuccess,
  onError,
  onRollback,
}) => {
  const { executeTransaction, isConnected } = useDatabase();
  const [transactionState, setTransactionState] = useState<{
    status: 'idle' | 'executing' | 'success' | 'error';
    results?: any[];
    error?: Error;
  }>({ status: 'idle' });

  const [optimisticState, setOptimisticState] = useState<{
    applied: boolean;
    originalData: Map<string, any>;
  }>({ applied: false, originalData: new Map() });

  const executeTransactionWithOptimism = useCallback(async () => {
    if (!isConnected) {
      onError(new Error('Database not connected'));
      return;
    }

    setTransactionState({ status: 'executing' });

    // Apply optimistic updates
    const originalData = new Map();
    operations.forEach((op, index) => {
      originalData.set(`${op.table}_${index}`, { ...op.data });
    });
    setOptimisticState({ applied: true, originalData });

    try {
      const dbOperations: DatabaseOperation[] = operations.map(op => ({
        type: op.type as DatabaseOperation['type'],
        table: op.table,
        data: op.data,
        where: op.type !== 'insert' ? { id: op.data.id } : undefined,
      }));

      const results = await executeTransaction(dbOperations);
      
      setTransactionState({ status: 'success', results });
      onSuccess(results);
    } catch (error) {
      // Rollback optimistic updates
      setOptimisticState({ applied: false, originalData: new Map() });
      setTransactionState({ status: 'error', error: error as Error });
      onError(error as Error);
      onRollback();
    }
  }, [operations, isConnected, executeTransaction, onSuccess, onError, onRollback]);

  const resetTransaction = () => {
    setTransactionState({ status: 'idle' });
    setOptimisticState({ applied: false, originalData: new Map() });
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
      <h4>Transaction Manager</h4>
      
      <div style={{ marginBottom: '15px' }}>
        <h5>Operations ({operations.length})</h5>
        {operations.map((op, index) => (
          <div key={index} style={{ 
            marginBottom: '5px', 
            padding: '5px', 
            backgroundColor: optimisticState.applied ? '#e7f5e7' : '#f8f9fa',
            border: '1px solid #ddd',
            borderRadius: '3px',
          }}>
            <strong>{op.type.toUpperCase()}</strong> on <em>{op.table}</em>
            {op.data && (
              <div style={{ fontSize: '12px', marginTop: '3px' }}>
                Data: {JSON.stringify(op.data, null, 2)}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '15px' }}>
        <div>
          Status: <strong style={{ 
            color: transactionState.status === 'success' ? 'green' : 
                   transactionState.status === 'error' ? 'red' : 
                   transactionState.status === 'executing' ? 'orange' : 'blue'
          }}>
            {transactionState.status.toUpperCase()}
          </strong>
        </div>
        {optimisticState.applied && (
          <div style={{ color: 'orange', fontSize: '12px' }}>
            Optimistic updates applied
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={executeTransactionWithOptimism}
          disabled={!isConnected || transactionState.status === 'executing' || operations.length === 0}
          style={{
            padding: '8px 16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {transactionState.status === 'executing' ? 'Executing...' : 'Execute Transaction'}
        </button>

        {transactionState.status !== 'idle' && (
          <button
            onClick={resetTransaction}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Reset
          </button>
        )}
      </div>

      {transactionState.error && (
        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8d7da', borderRadius: '4px' }}>
          <strong>Error:</strong> {transactionState.error.message}
        </div>
      )}

      {transactionState.results && (
        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#d4edda', borderRadius: '4px' }}>
          <strong>Success:</strong> Transaction completed successfully
          <details style={{ marginTop: '5px' }}>
            <summary>Results</summary>
            <pre style={{ fontSize: '12px', overflow: 'auto' }}>
              {JSON.stringify(transactionState.results, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

// CacheSync Component
export interface CacheSyncProps {
  tables: string[];
  syncInterval?: number;
  onSyncComplete: (stats: { updated: number; conflicts: number }) => void;
  onConflict: (conflict: { table: string; localData: any; remoteData: any }) => void;
}

export const CacheSync: React.FC<CacheSyncProps> = ({
  tables,
  syncInterval = 30000,
  onSyncComplete,
  onConflict,
}) => {
  const { executeQuery, isConnected } = useDatabase();
  const [cache, setCache] = useState<Map<string, CacheEntry>>(new Map());
  const [syncStats, setSyncStats] = useState({
    lastSync: null as Date | null,
    totalSyncs: 0,
    conflicts: 0,
    errors: 0,
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const syncIntervalRef = useRef<NodeJS.Timeout>();

  const performSync = useCallback(async () => {
    if (!isConnected || isSyncing) return;

    setIsSyncing(true);
    let updated = 0;
    let conflicts = 0;

    try {
      for (const table of tables) {
        const cacheKey = `${table}_data`;
        const localEntry = cache.get(cacheKey);

        // Fetch remote data
        const remoteResult = await executeQuery(`SELECT * FROM ${table} ORDER BY updated_at DESC`);
        const remoteData = remoteResult.rows || [];

        if (localEntry && localEntry.dirty) {
          // Check for conflicts
          const remoteVersion = remoteData[0]?.version || 0;
          if (remoteVersion > localEntry.version) {
            conflicts++;
            onConflict({
              table,
              localData: localEntry.data,
              remoteData: remoteData[0],
            });
            continue;
          }
        }

        // Update cache
        const newEntry: CacheEntry = {
          data: remoteData,
          timestamp: Date.now(),
          version: remoteData[0]?.version || 0,
          dirty: false,
        };

        setCache(prev => new Map(prev).set(cacheKey, newEntry));
        updated++;
      }

      setSyncStats(prev => ({
        ...prev,
        lastSync: new Date(),
        totalSyncs: prev.totalSyncs + 1,
        conflicts: prev.conflicts + conflicts,
      }));

      onSyncComplete({ updated, conflicts });
    } catch (error) {
      setSyncStats(prev => ({
        ...prev,
        errors: prev.errors + 1,
      }));
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [tables, cache, isConnected, isSyncing, executeQuery, onSyncComplete, onConflict]);

  // Start periodic sync
  useEffect(() => {
    if (isConnected && syncInterval > 0) {
      syncIntervalRef.current = setInterval(performSync, syncInterval);
      // Perform initial sync
      performSync();
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [isConnected, syncInterval, performSync]);

  const markCacheDirty = (table: string, data: any) => {
    const cacheKey = `${table}_data`;
    const existing = cache.get(cacheKey);
    
    setCache(prev => new Map(prev).set(cacheKey, {
      data,
      timestamp: Date.now(),
      version: (existing?.version || 0) + 1,
      dirty: true,
    }));
  };

  const getCachedData = (table: string) => {
    const cacheKey = `${table}_data`;
    return cache.get(cacheKey)?.data || [];
  };

  const clearCache = () => {
    setCache(new Map());
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
      <h4>Cache Sync Manager</h4>
      
      <div style={{ marginBottom: '15px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          <div>
            <strong>Tables:</strong> {tables.join(', ')}
          </div>
          <div>
            <strong>Sync Interval:</strong> {syncInterval / 1000}s
          </div>
          <div>
            <strong>Total Syncs:</strong> {syncStats.totalSyncs}
          </div>
          <div>
            <strong>Conflicts:</strong> {syncStats.conflicts}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <div>
          <strong>Last Sync:</strong> {
            syncStats.lastSync 
              ? syncStats.lastSync.toLocaleTimeString()
              : 'Never'
          }
        </div>
        <div style={{ marginTop: '5px' }}>
          <strong>Status:</strong> 
          <span style={{ 
            color: isSyncing ? 'orange' : isConnected ? 'green' : 'red',
            marginLeft: '5px',
          }}>
            {isSyncing ? 'Syncing...' : isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <h5>Cache Status</h5>
        {tables.map(table => {
          const cacheKey = `${table}_data`;
          const entry = cache.get(cacheKey);
          return (
            <div key={table} style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              padding: '5px',
              backgroundColor: entry?.dirty ? '#fff3cd' : '#d4edda',
              margin: '2px 0',
              borderRadius: '3px',
            }}>
              <span>{table}</span>
              <span style={{ fontSize: '12px' }}>
                {entry ? (
                  <>
                    {entry.data.length} records
                    {entry.dirty && ' (dirty)'}
                  </>
                ) : (
                  'No cache'
                )}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={performSync}
          disabled={!isConnected || isSyncing}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </button>

        <button
          onClick={clearCache}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Clear Cache
        </button>
      </div>
    </div>
  );
};

// Demo component showing database integration patterns
export const DatabaseIntegrationDemo: React.FC = () => {
  const [queryResult, setQueryResult] = useState<any>(null);
  const [queryError, setQueryError] = useState<Error | null>(null);
  
  const sampleOperations = [
    { type: 'insert' as const, table: 'users', data: { name: 'John Doe', email: 'john@example.com' } },
    { type: 'update' as const, table: 'users', data: { id: 1, name: 'John Smith' } },
    { type: 'insert' as const, table: 'profiles', data: { userId: 1, bio: 'Software Developer' } },
  ];

  return (
    <DatabaseProvider>
      <div style={{ padding: '20px', maxWidth: '1200px' }}>
        <h2>Database Integration Demo</h2>
        <p>Enterprise-grade database integration with Prisma/Supabase patterns</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
          <div>
            <h3>Query Builder</h3>
            <QueryBuilder
              table="users"
              onQuery={(result) => {
                setQueryResult(result);
                setQueryError(null);
              }}
              onError={(error) => {
                setQueryError(error);
                setQueryResult(null);
              }}
            />
            
            {queryResult && (
              <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#d4edda', borderRadius: '4px' }}>
                <strong>Query Result:</strong>
                <pre style={{ fontSize: '12px', overflow: 'auto', marginTop: '5px' }}>
                  {JSON.stringify(queryResult, null, 2)}
                </pre>
              </div>
            )}
            
            {queryError && (
              <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8d7da', borderRadius: '4px' }}>
                <strong>Error:</strong> {queryError.message}
              </div>
            )}
          </div>

          <div>
            <h3>Cache Sync</h3>
            <CacheSync
              tables={['users', 'profiles', 'posts']}
              syncInterval={15000}
              onSyncComplete={(stats) => {
                console.log('Sync complete:', stats);
              }}
              onConflict={(conflict) => {
                console.log('Sync conflict detected:', conflict);
              }}
            />
          </div>
        </div>

        <div style={{ marginTop: '20px' }}>
          <h3>Transaction Manager</h3>
          <TransactionManager
            operations={sampleOperations}
            onSuccess={(results) => {
              console.log('Transaction completed successfully:', results);
            }}
            onError={(error) => {
              console.error('Transaction failed:', error);
            }}
            onRollback={() => {
              console.log('Transaction rolled back');
            }}
          />
        </div>
      </div>
    </DatabaseProvider>
  );
};

export default DatabaseIntegrationDemo;