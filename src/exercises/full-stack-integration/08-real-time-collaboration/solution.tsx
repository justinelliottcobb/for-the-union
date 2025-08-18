import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { EventEmitter } from 'events';

// Types and Interfaces
interface Operation {
  type: 'insert' | 'delete' | 'retain';
  position: number;
  content?: string;
  length?: number;
  userId: string;
  timestamp: number;
  id?: string;
}

interface CRDTChar {
  id: string;
  content: string;
  userId: string;
  timestamp: number;
  deleted: boolean;
  position?: number;
}

interface UserCursor {
  userId: string;
  position: number;
  selection?: { start: number; end: number };
  color: string;
  name: string;
  lastSeen: Date;
}

interface Conflict {
  type: 'insert-insert' | 'delete-modify' | 'concurrent-edit';
  operations: Operation[];
  position: number;
}

interface ResolutionStrategy {
  strategy: 'last-writer-wins' | 'merge' | 'user-choice';
  operations: Operation[];
  metadata?: any;
}

interface DocumentVersion {
  id: string;
  operations: Operation[];
  timestamp: Date;
  parentVersion?: string;
  author: string;
}

interface Branch {
  id: string;
  name: string;
  versions: DocumentVersion[];
  head: string;
}

interface MergeResult {
  success: boolean;
  conflicts: Conflict[];
  mergedOperations?: Operation[];
}

interface ConflictOptions {
  insertConflictStrategy?: 'last-writer-wins' | 'merge-lexicographically' | 'user-priority';
  deleteConflictStrategy?: 'delete-wins' | 'user-priority' | 'merge';
}

// Operational Transform Engine
export class OperationalTransform {
  transform(op1: Operation, op2: Operation): [Operation, Operation] {
    // Handle insert-insert conflicts
    if (op1.type === 'insert' && op2.type === 'insert') {
      if (op1.position <= op2.position) {
        return [
          op1,
          { ...op2, position: op2.position + (op1.content?.length || 0) }
        ];
      } else {
        return [
          { ...op1, position: op1.position + (op2.content?.length || 0) },
          op2
        ];
      }
    }

    // Handle insert-delete conflicts
    if (op1.type === 'insert' && op2.type === 'delete') {
      if (op1.position <= op2.position) {
        return [
          op1,
          { ...op2, position: op2.position + (op1.content?.length || 0) }
        ];
      } else if (op1.position > op2.position + (op2.length || 0)) {
        return [
          { ...op1, position: op1.position - (op2.length || 0) },
          op2
        ];
      } else {
        // Insert is within delete range - adjust delete
        return [
          { ...op1, position: op2.position },
          { ...op2, length: (op2.length || 0) + (op1.content?.length || 0) }
        ];
      }
    }

    // Handle delete-insert conflicts
    if (op1.type === 'delete' && op2.type === 'insert') {
      if (op2.position <= op1.position) {
        return [
          { ...op1, position: op1.position + (op2.content?.length || 0) },
          op2
        ];
      } else if (op2.position >= op1.position + (op1.length || 0)) {
        return [
          op1,
          { ...op2, position: op2.position - (op1.length || 0) }
        ];
      } else {
        // Insert is within delete range
        return [
          op1,
          { ...op2, position: op1.position }
        ];
      }
    }

    // Handle delete-delete conflicts
    if (op1.type === 'delete' && op2.type === 'delete') {
      const op1End = op1.position + (op1.length || 0);
      const op2End = op2.position + (op2.length || 0);

      if (op1End <= op2.position) {
        // No overlap
        return [
          op1,
          { ...op2, position: op2.position - (op1.length || 0) }
        ];
      } else if (op2End <= op1.position) {
        // No overlap
        return [
          { ...op1, position: op1.position - (op2.length || 0) },
          op2
        ];
      } else {
        // Overlapping deletes - merge them
        const newStart = Math.min(op1.position, op2.position);
        const newEnd = Math.max(op1End, op2End);
        return [
          { ...op1, position: newStart, length: newEnd - newStart },
          { ...op2, type: 'retain', position: 0, length: 0 } // No-op
        ];
      }
    }

    return [op1, op2];
  }

  transformBatch(operations: Operation[]): Operation[] {
    const transformed: Operation[] = [];
    
    for (let i = 0; i < operations.length; i++) {
      let op = operations[i];
      
      // Transform against all previous operations
      for (let j = 0; j < i; j++) {
        const [, transformedOp] = this.transform(transformed[j], op);
        op = transformedOp;
      }
      
      transformed.push(op);
    }
    
    return transformed;
  }

  compose(ops: Operation[]): Operation {
    if (ops.length === 0) {
      return { type: 'retain', position: 0, userId: '', timestamp: Date.now() };
    }

    let result = ops[0];
    for (let i = 1; i < ops.length; i++) {
      result = this.composeTwo(result, ops[i]);
    }

    return result;
  }

  private composeTwo(op1: Operation, op2: Operation): Operation {
    if (op1.type === 'insert' && op2.type === 'insert') {
      return {
        ...op1,
        content: (op1.content || '') + (op2.content || ''),
        timestamp: Math.max(op1.timestamp, op2.timestamp)
      };
    }

    // For simplicity, return the later operation
    return op1.timestamp > op2.timestamp ? op1 : op2;
  }

  invert(op: Operation, document: string): Operation {
    if (op.type === 'insert') {
      return {
        type: 'delete',
        position: op.position,
        length: op.content?.length || 0,
        userId: op.userId,
        timestamp: Date.now()
      };
    }

    if (op.type === 'delete') {
      const deletedContent = document.substring(op.position, op.position + (op.length || 0));
      return {
        type: 'insert',
        position: op.position,
        content: deletedContent,
        userId: op.userId,
        timestamp: Date.now()
      };
    }

    return op;
  }
}

// CRDT Implementation
export class CRDT {
  private replicaId: string;
  private chars: CRDTChar[] = [];
  private operations: Operation[] = [];
  private clock = 0;

  constructor(replicaId: string) {
    this.replicaId = replicaId;
  }

  insert(position: number, content: string): Operation {
    this.clock++;
    
    const operation: Operation = {
      type: 'insert',
      position,
      content,
      userId: this.replicaId,
      timestamp: Date.now(),
      id: `${this.replicaId}-${this.clock}`
    };

    this.applyOperation(operation);
    return operation;
  }

  delete(position: number, length: number): Operation {
    this.clock++;
    
    const operation: Operation = {
      type: 'delete',
      position,
      length,
      userId: this.replicaId,
      timestamp: Date.now(),
      id: `${this.replicaId}-${this.clock}`
    };

    this.applyOperation(operation);
    return operation;
  }

  applyOperation(op: Operation): void {
    this.operations.push(op);

    if (op.type === 'insert') {
      const content = op.content || '';
      for (let i = 0; i < content.length; i++) {
        const char: CRDTChar = {
          id: `${op.id}-${i}`,
          content: content[i],
          userId: op.userId,
          timestamp: op.timestamp,
          deleted: false,
          position: op.position + i
        };
        
        this.insertCharAt(op.position + i, char);
      }
    } else if (op.type === 'delete') {
      for (let i = 0; i < (op.length || 0); i++) {
        this.deleteCharAt(op.position);
      }
    }
  }

  applyOperations(ops: Operation[]): void {
    ops.forEach(op => this.applyOperation(op));
  }

  private insertCharAt(position: number, char: CRDTChar): void {
    // Find the correct insertion point maintaining order
    let insertIndex = 0;
    for (let i = 0; i < this.chars.length; i++) {
      if (this.chars[i].deleted) continue;
      
      if (insertIndex >= position) {
        break;
      }
      insertIndex++;
    }

    // Insert at the calculated position
    this.chars.splice(this.findActualIndex(insertIndex), 0, char);
  }

  private deleteCharAt(position: number): void {
    let currentPos = 0;
    for (let i = 0; i < this.chars.length; i++) {
      if (this.chars[i].deleted) continue;
      
      if (currentPos === position) {
        this.chars[i].deleted = true;
        return;
      }
      currentPos++;
    }
  }

  private findActualIndex(logicalIndex: number): number {
    let logical = 0;
    for (let i = 0; i < this.chars.length; i++) {
      if (this.chars[i].deleted) continue;
      
      if (logical === logicalIndex) {
        return i;
      }
      logical++;
    }
    return this.chars.length;
  }

  getText(): string {
    return this.chars
      .filter(char => !char.deleted)
      .map(char => char.content)
      .join('');
  }

  getOperations(): Operation[] {
    return [...this.operations];
  }

  getLastOperation(): Operation | null {
    return this.operations[this.operations.length - 1] || null;
  }
}

// Conflict Resolver
export class ConflictResolver {
  private options: ConflictOptions;

  constructor(options: ConflictOptions = {}) {
    this.options = {
      insertConflictStrategy: 'last-writer-wins',
      deleteConflictStrategy: 'delete-wins',
      ...options
    };
  }

  detectConflicts(operations: Operation[]): Conflict[] {
    const conflicts: Conflict[] = [];
    
    for (let i = 0; i < operations.length; i++) {
      for (let j = i + 1; j < operations.length; j++) {
        const op1 = operations[i];
        const op2 = operations[j];
        
        const conflict = this.detectConflictBetween(op1, op2);
        if (conflict) {
          conflicts.push(conflict);
        }
      }
    }
    
    return conflicts;
  }

  private detectConflictBetween(op1: Operation, op2: Operation): Conflict | null {
    if (op1.type === 'insert' && op2.type === 'insert' && op1.position === op2.position) {
      return {
        type: 'insert-insert',
        operations: [op1, op2],
        position: op1.position
      };
    }

    if (op1.type === 'delete' && op2.type === 'insert') {
      const deleteEnd = op1.position + (op1.length || 0);
      if (op2.position >= op1.position && op2.position <= deleteEnd) {
        return {
          type: 'delete-modify',
          operations: [op1, op2],
          position: op1.position
        };
      }
    }

    return null;
  }

  resolve(conflict: Conflict): ResolutionStrategy {
    switch (conflict.type) {
      case 'insert-insert':
        return this.resolveInsertInsert(conflict);
      case 'delete-modify':
        return this.resolveDeleteModify(conflict);
      default:
        return {
          strategy: 'last-writer-wins',
          operations: [conflict.operations[conflict.operations.length - 1]]
        };
    }
  }

  private resolveInsertInsert(conflict: Conflict): ResolutionStrategy {
    const [op1, op2] = conflict.operations;
    
    switch (this.options.insertConflictStrategy) {
      case 'merge-lexicographically':
        const sorted = [op1, op2].sort((a, b) => 
          (a.content || '').localeCompare(b.content || '')
        );
        return {
          strategy: 'merge',
          operations: sorted.map((op, index) => ({
            ...op,
            position: op.position + (index * (sorted[0].content?.length || 0))
          }))
        };
        
      case 'last-writer-wins':
      default:
        const latest = op1.timestamp > op2.timestamp ? op1 : op2;
        const other = latest === op1 ? op2 : op1;
        return {
          strategy: 'last-writer-wins',
          operations: [
            other,
            { ...latest, position: latest.position + (other.content?.length || 0) }
          ]
        };
    }
  }

  private resolveDeleteModify(conflict: Conflict): ResolutionStrategy {
    switch (this.options.deleteConflictStrategy) {
      case 'delete-wins':
      default:
        return {
          strategy: 'delete-wins',
          operations: [conflict.operations[0]] // Keep only the delete
        };
    }
  }

  applyResolution(resolution: ResolutionStrategy): Operation[] {
    return resolution.operations;
  }
}

// Presence Indicator
export class PresenceIndicator {
  private cursors = new Map<string, UserCursor>();
  private userTimeout: number;
  private cleanupInterval?: NodeJS.Timer;

  constructor(options: { userTimeout?: number } = {}) {
    this.userTimeout = options.userTimeout || 30000; // 30 seconds
    
    if (this.userTimeout > 0) {
      this.cleanupInterval = setInterval(() => {
        this.cleanupInactiveUsers(this.userTimeout);
      }, this.userTimeout / 2);
    }
  }

  updateUserCursor(userId: string, cursor: Partial<UserCursor>): void {
    const existing = this.cursors.get(userId);
    const updated: UserCursor = {
      userId,
      position: 0,
      color: this.generateUserColor(userId),
      name: userId,
      lastSeen: new Date(),
      ...existing,
      ...cursor
    };
    
    this.cursors.set(userId, updated);
  }

  transformCursors(operation: Operation): void {
    this.cursors.forEach((cursor, userId) => {
      const transformed = this.transformCursor(cursor, operation);
      this.cursors.set(userId, transformed);
    });
  }

  private transformCursor(cursor: UserCursor, operation: Operation): UserCursor {
    if (operation.type === 'insert') {
      if (cursor.position >= operation.position) {
        return {
          ...cursor,
          position: cursor.position + (operation.content?.length || 0)
        };
      }
      
      if (cursor.selection) {
        const { start, end } = cursor.selection;
        return {
          ...cursor,
          selection: {
            start: start >= operation.position ? start + (operation.content?.length || 0) : start,
            end: end >= operation.position ? end + (operation.content?.length || 0) : end
          }
        };
      }
    }

    if (operation.type === 'delete') {
      const deleteEnd = operation.position + (operation.length || 0);
      
      if (cursor.position > deleteEnd) {
        return {
          ...cursor,
          position: cursor.position - (operation.length || 0)
        };
      } else if (cursor.position >= operation.position) {
        return {
          ...cursor,
          position: operation.position
        };
      }
    }

    return cursor;
  }

  getAllCursors(): UserCursor[] {
    return Array.from(this.cursors.values());
  }

  removeUser(userId: string): void {
    this.cursors.delete(userId);
  }

  cleanupInactiveUsers(timeout: number): void {
    const now = new Date();
    const toRemove: string[] = [];
    
    this.cursors.forEach((cursor, userId) => {
      if (now.getTime() - cursor.lastSeen.getTime() > timeout) {
        toRemove.push(userId);
      }
    });
    
    toRemove.forEach(userId => this.removeUser(userId));
  }

  private generateUserColor(userId: string): string {
    // Generate a consistent color for each user
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash + userId.charCodeAt(i)) & 0xffffffff;
    }
    
    return colors[Math.abs(hash) % colors.length];
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Version Control
export class VersionControl {
  private branches = new Map<string, Branch>();
  private currentBranch = 'main';
  private versionCounter = 0;

  constructor() {
    this.branches.set('main', {
      id: 'main',
      name: 'main',
      versions: [],
      head: ''
    });
  }

  applyOperation(operation: Operation, branchId = 'main'): void {
    const branch = this.branches.get(branchId);
    if (!branch) {
      throw new Error(`Branch ${branchId} does not exist`);
    }

    this.versionCounter++;
    const version: DocumentVersion = {
      id: `v${this.versionCounter}`,
      operations: [operation],
      timestamp: new Date(),
      parentVersion: branch.head || undefined,
      author: operation.userId
    };

    branch.versions.push(version);
    branch.head = version.id;
  }

  createBranch(name: string, fromVersion?: string): string {
    const branchId = `branch-${name}-${Date.now()}`;
    const sourceVersion = fromVersion || this.branches.get('main')?.head;
    
    this.branches.set(branchId, {
      id: branchId,
      name,
      versions: sourceVersion ? [...this.getVersionsUpTo(sourceVersion)] : [],
      head: sourceVersion || ''
    });

    return branchId;
  }

  mergeBranch(sourceBranchId: string, targetBranchId: string): MergeResult {
    const sourceBranch = this.branches.get(sourceBranchId);
    const targetBranch = this.branches.get(targetBranchId);
    
    if (!sourceBranch || !targetBranch) {
      return { success: false, conflicts: [] };
    }

    // Find divergence point
    const sourceVersions = sourceBranch.versions;
    const targetVersions = targetBranch.versions;
    
    // Simple merge strategy - detect conflicts
    const conflictResolver = new ConflictResolver();
    const allOperations = [
      ...sourceVersions.flatMap(v => v.operations),
      ...targetVersions.flatMap(v => v.operations)
    ];
    
    const conflicts = conflictResolver.detectConflicts(allOperations);
    
    if (conflicts.length > 0) {
      return { success: false, conflicts };
    }

    // No conflicts - merge successfully
    sourceVersions.forEach(version => {
      targetBranch.versions.push(version);
    });
    
    targetBranch.head = sourceBranch.head;
    
    return { success: true, conflicts: [], mergedOperations: allOperations };
  }

  getHistory(branchId = 'main'): DocumentVersion[] {
    const branch = this.branches.get(branchId);
    return branch ? [...branch.versions] : [];
  }

  getDocumentAtVersion(versionId: string): string {
    const operations = this.getOperationsUpToVersion(versionId);
    return this.applyOperationsToDocument('', operations);
  }

  getCurrentVersion(): number {
    return this.versionCounter;
  }

  private getVersionsUpTo(versionId: string): DocumentVersion[] {
    for (const branch of this.branches.values()) {
      const index = branch.versions.findIndex(v => v.id === versionId);
      if (index !== -1) {
        return branch.versions.slice(0, index + 1);
      }
    }
    return [];
  }

  private getOperationsUpToVersion(versionId: string): Operation[] {
    const versions = this.getVersionsUpTo(versionId);
    return versions.flatMap(v => v.operations);
  }

  private applyOperationsToDocument(initialText: string, operations: Operation[]): string {
    let text = initialText;
    
    operations.forEach(op => {
      if (op.type === 'insert') {
        const before = text.substring(0, op.position);
        const after = text.substring(op.position);
        text = before + (op.content || '') + after;
      } else if (op.type === 'delete') {
        const before = text.substring(0, op.position);
        const after = text.substring(op.position + (op.length || 0));
        text = before + after;
      }
    });
    
    return text;
  }
}

// useCollaboration Hook
interface CollaborationState {
  document: CRDT;
  cursors: UserCursor[];
  collaborators: string[];
  insertText: (position: number, text: string) => void;
  deleteText: (position: number, length: number) => void;
  setCursor: (position: number, selection?: { start: number; end: number }) => void;
  undo: () => void;
  redo: () => void;
}

export const useCollaboration = (documentId: string, userId: string): CollaborationState => {
  const [document] = useState(() => new CRDT(userId));
  const [presence] = useState(() => new PresenceIndicator());
  const [cursors, setCursors] = useState<UserCursor[]>([]);
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const undoStack = useRef<Operation[]>([]);
  const redoStack = useRef<Operation[]>([]);

  useEffect(() => {
    // Update cursors when presence changes
    const updateCursors = () => {
      setCursors(presence.getAllCursors());
    };

    const interval = setInterval(updateCursors, 1000);
    return () => {
      clearInterval(interval);
      presence.destroy();
    };
  }, [presence]);

  const insertText = useCallback((position: number, text: string) => {
    const operation = document.insert(position, text);
    presence.transformCursors(operation);
    undoStack.current.push(operation);
    redoStack.current = [];
  }, [document, presence]);

  const deleteText = useCallback((position: number, length: number) => {
    const operation = document.delete(position, length);
    presence.transformCursors(operation);
    undoStack.current.push(operation);
    redoStack.current = [];
  }, [document, presence]);

  const setCursor = useCallback((position: number, selection?: { start: number; end: number }) => {
    presence.updateUserCursor(userId, { position, selection });
  }, [userId, presence]);

  const undo = useCallback(() => {
    const lastOp = undoStack.current.pop();
    if (lastOp) {
      // Create inverse operation
      const currentText = document.getText();
      const ot = new OperationalTransform();
      const inverseOp = ot.invert(lastOp, currentText);
      
      document.applyOperation(inverseOp);
      redoStack.current.push(lastOp);
    }
  }, [document]);

  const redo = useCallback(() => {
    const redoOp = redoStack.current.pop();
    if (redoOp) {
      document.applyOperation(redoOp);
      undoStack.current.push(redoOp);
    }
  }, [document]);

  return {
    document,
    cursors,
    collaborators,
    insertText,
    deleteText,
    setCursor,
    undo,
    redo
  };
};

// Collaborative Editor Component
interface CollaborativeEditorProps {
  documentId: string;
  userId: string;
  initialContent?: string;
  collaborators?: UserCursor[];
  onContentChange?: (content: string) => void;
  onCursorChange?: (cursor: UserCursor) => void;
}

export const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  documentId,
  userId,
  initialContent = '',
  collaborators = [],
  onContentChange,
  onCursorChange
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const collaboration = useCollaboration(documentId, userId);
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    if (initialContent) {
      collaboration.insertText(0, initialContent);
    }
  }, [initialContent, collaboration]);

  useEffect(() => {
    const newContent = collaboration.document.getText();
    setContent(newContent);
    onContentChange?.(newContent);
  }, [collaboration.document, onContentChange]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const selectionStart = e.target.selectionStart;
    
    if (newValue.length > content.length) {
      // Text was inserted
      const insertedText = newValue.substring(selectionStart - (newValue.length - content.length), selectionStart);
      const insertPosition = selectionStart - insertedText.length;
      collaboration.insertText(insertPosition, insertedText);
    } else if (newValue.length < content.length) {
      // Text was deleted
      const deleteLength = content.length - newValue.length;
      collaboration.deleteText(selectionStart, deleteLength);
    }
    
    collaboration.setCursor(selectionStart);
  };

  const handleSelectionChange = () => {
    if (textareaRef.current) {
      const { selectionStart, selectionEnd } = textareaRef.current;
      const cursor: UserCursor = {
        userId,
        position: selectionStart,
        selection: selectionStart !== selectionEnd ? { start: selectionStart, end: selectionEnd } : undefined,
        color: '#007bff',
        name: userId,
        lastSeen: new Date()
      };
      
      collaboration.setCursor(selectionStart, cursor.selection);
      onCursorChange?.(cursor);
    }
  };

  return (
    <div style={{ position: 'relative', border: '1px solid #ddd', borderRadius: '4px' }}>
      {/* User presence indicators */}
      <div style={{ padding: '8px', borderBottom: '1px solid #eee', backgroundColor: '#f8f9fa' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#666' }}>Active users:</span>
          {collaboration.cursors.map(cursor => (
            <div
              key={cursor.userId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 6px',
                backgroundColor: cursor.color,
                color: 'white',
                borderRadius: '12px',
                fontSize: '12px'
              }}
            >
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: 'white'
                }}
              />
              {cursor.name}
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div style={{ position: 'relative' }}>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextChange}
          onSelect={handleSelectionChange}
          style={{
            width: '100%',
            height: '300px',
            padding: '12px',
            border: 'none',
            outline: 'none',
            resize: 'vertical',
            fontFamily: 'Monaco, Consolas, "Liberation Mono", Courier, monospace',
            fontSize: '14px',
            lineHeight: '1.5'
          }}
          placeholder="Start typing..."
          data-testid={`cursor-${userId}`}
        />

        {/* Cursor overlays */}
        {collaboration.cursors.filter(c => c.userId !== userId).map(cursor => (
          <div
            key={cursor.userId}
            data-testid={`cursor-${cursor.userId}`}
            style={{
              position: 'absolute',
              left: '12px', // Approximate cursor position
              top: `${12 + cursor.position * 0.1}px`, // Rough estimation
              width: '2px',
              height: '20px',
              backgroundColor: cursor.color,
              pointerEvents: 'none',
              zIndex: 10
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-20px',
                left: '0',
                padding: '2px 4px',
                backgroundColor: cursor.color,
                color: 'white',
                fontSize: '10px',
                borderRadius: '2px',
                whiteSpace: 'nowrap'
              }}
            >
              {cursor.name}
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ padding: '8px', borderTop: '1px solid #eee', display: 'flex', gap: '8px' }}>
        <button
          onClick={collaboration.undo}
          style={{
            padding: '4px 8px',
            border: '1px solid #ddd',
            borderRadius: '3px',
            backgroundColor: 'white',
            cursor: 'pointer'
          }}
        >
          Undo
        </button>
        <button
          onClick={collaboration.redo}
          style={{
            padding: '4px 8px',
            border: '1px solid #ddd',
            borderRadius: '3px',
            backgroundColor: 'white',
            cursor: 'pointer'
          }}
        >
          Redo
        </button>
      </div>
    </div>
  );
};

// Demo Component
export const CollaborationDemo: React.FC = () => {
  const [documentId] = useState('demo-doc');
  const [users] = useState(['Alice', 'Bob', 'Carol']);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Real-time Collaboration Demo</h1>
      <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
        {users.map(user => (
          <div key={user}>
            <h3>{user}'s Editor</h3>
            <CollaborativeEditor
              documentId={documentId}
              userId={user}
              initialContent={user === 'Alice' ? 'Welcome to collaborative editing!' : ''}
              onContentChange={(content) => console.log(`${user} changed content:`, content)}
              onCursorChange={(cursor) => console.log(`${user} cursor:`, cursor)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CollaborationDemo;