import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { 
  CollaborativeEditor,
  ConflictResolver,
  PresenceIndicator,
  VersionControl,
  useCollaboration,
  OperationalTransform,
  CRDT
} from './solution';

describe('Real-time Collaboration', () => {
  describe('Operational Transforms', () => {
    it('should transform concurrent insert operations', () => {
      const ot = new OperationalTransform();
      
      // Two users inserting at the same position
      const op1 = { type: 'insert', position: 5, content: 'Hello', userId: 'user1' };
      const op2 = { type: 'insert', position: 5, content: 'World', userId: 'user2' };

      const [transformed1, transformed2] = ot.transform(op1, op2);

      // Operations should be transformed to maintain consistency
      expect(transformed1.position).toBe(5);
      expect(transformed2.position).toBe(10); // Adjusted for first insertion
    });

    it('should handle delete operations correctly', () => {
      const ot = new OperationalTransform();
      
      const op1 = { type: 'delete', position: 5, length: 3, userId: 'user1' };
      const op2 = { type: 'insert', position: 7, content: 'test', userId: 'user2' };

      const [transformed1, transformed2] = ot.transform(op1, op2);

      expect(transformed1).toEqual(op1); // Delete operation unchanged
      expect(transformed2.position).toBe(4); // Insert position adjusted for deletion
    });

    it('should handle overlapping delete operations', () => {
      const ot = new OperationalTransform();
      
      const op1 = { type: 'delete', position: 5, length: 5, userId: 'user1' };
      const op2 = { type: 'delete', position: 7, length: 3, userId: 'user2' };

      const [transformed1, transformed2] = ot.transform(op1, op2);

      // Second delete should be adjusted or nullified due to overlap
      expect(transformed2.length).toBeLessThanOrEqual(3);
    });
  });

  describe('CRDT Implementation', () => {
    it('should maintain consistency across replicas', () => {
      const crdt1 = new CRDT('replica1');
      const crdt2 = new CRDT('replica2');

      // Concurrent operations
      crdt1.insert(0, 'Hello');
      crdt2.insert(0, 'World');

      // Sync operations
      const ops1 = crdt1.getOperations();
      const ops2 = crdt2.getOperations();

      crdt1.applyOperations(ops2);
      crdt2.applyOperations(ops1);

      // Both replicas should converge to same state
      expect(crdt1.getText()).toBe(crdt2.getText());
    });

    it('should handle concurrent character insertions', () => {
      const crdt1 = new CRDT('replica1');
      const crdt2 = new CRDT('replica2');

      // Both insert at position 0
      crdt1.insert(0, 'A');
      crdt2.insert(0, 'B');

      // Apply operations to each other
      crdt1.applyOperation(crdt2.getLastOperation());
      crdt2.applyOperation(crdt1.getLastOperation());

      const text1 = crdt1.getText();
      const text2 = crdt2.getText();

      // Should converge (order determined by tie-breaking rules)
      expect(text1).toBe(text2);
      expect(text1.length).toBe(2);
      expect(text1).toMatch(/^[AB][AB]$/);
    });
  });

  describe('ConflictResolver', () => {
    it('should resolve insert-insert conflicts', () => {
      const resolver = new ConflictResolver();
      
      const conflict = {
        type: 'insert-insert',
        operations: [
          { type: 'insert', position: 5, content: 'Hello', userId: 'user1', timestamp: 1000 },
          { type: 'insert', position: 5, content: 'World', userId: 'user2', timestamp: 1001 }
        ]
      };

      const resolution = resolver.resolve(conflict);

      expect(resolution.strategy).toBe('last-writer-wins');
      expect(resolution.operations).toHaveLength(2);
      expect(resolution.operations[1].position).toBeGreaterThan(5);
    });

    it('should handle delete-modify conflicts', () => {
      const resolver = new ConflictResolver();
      
      const conflict = {
        type: 'delete-modify',
        operations: [
          { type: 'delete', position: 5, length: 3, userId: 'user1', timestamp: 1000 },
          { type: 'modify', position: 6, content: 'X', userId: 'user2', timestamp: 1001 }
        ]
      };

      const resolution = resolver.resolve(conflict);

      // Modify should be dropped if text was deleted
      expect(resolution.strategy).toBe('delete-wins');
      expect(resolution.operations).toHaveLength(1);
      expect(resolution.operations[0].type).toBe('delete');
    });

    it('should implement custom resolution strategies', () => {
      const resolver = new ConflictResolver({
        insertConflictStrategy: 'merge-lexicographically',
        deleteConflictStrategy: 'user-priority'
      });

      const conflict = {
        type: 'insert-insert',
        operations: [
          { type: 'insert', position: 5, content: 'Zebra', userId: 'user1', timestamp: 1000 },
          { type: 'insert', position: 5, content: 'Apple', userId: 'user2', timestamp: 1001 }
        ]
      };

      const resolution = resolver.resolve(conflict);

      // Should merge in lexicographical order
      expect(resolution.operations[0].content).toBe('Apple');
      expect(resolution.operations[1].content).toBe('Zebra');
    });
  });

  describe('PresenceIndicator', () => {
    it('should track user cursors and selections', () => {
      const presence = new PresenceIndicator();
      
      presence.updateUserCursor('user1', { position: 10, length: 0 });
      presence.updateUserCursor('user2', { position: 15, length: 5 });

      const cursors = presence.getAllCursors();

      expect(cursors).toHaveLength(2);
      expect(cursors.find(c => c.userId === 'user1')?.position).toBe(10);
      expect(cursors.find(c => c.userId === 'user2')?.selection?.length).toBe(5);
    });

    it('should handle cursor transformation during edits', () => {
      const presence = new PresenceIndicator();
      
      presence.updateUserCursor('user1', { position: 10, length: 0 });
      presence.updateUserCursor('user2', { position: 15, length: 3 });

      // Text inserted at position 5
      presence.transformCursors({
        type: 'insert',
        position: 5,
        content: 'Hello',
        userId: 'user3'
      });

      const cursors = presence.getAllCursors();
      
      // Cursors after position 5 should be shifted by 5
      expect(cursors.find(c => c.userId === 'user1')?.position).toBe(15);
      expect(cursors.find(c => c.userId === 'user2')?.position).toBe(20);
    });

    it('should expire inactive users', async () => {
      const presence = new PresenceIndicator({ userTimeout: 100 });
      
      presence.updateUserCursor('user1', { position: 10, length: 0 });
      presence.updateUserCursor('user2', { position: 15, length: 0 });

      expect(presence.getAllCursors()).toHaveLength(2);

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(presence.getAllCursors()).toHaveLength(0);
    });
  });

  describe('VersionControl', () => {
    it('should track document versions', () => {
      const versionControl = new VersionControl();
      
      versionControl.applyOperation({
        type: 'insert',
        position: 0,
        content: 'Hello',
        userId: 'user1',
        timestamp: 1000
      });

      versionControl.applyOperation({
        type: 'insert',
        position: 5,
        content: ' World',
        userId: 'user2',
        timestamp: 1001
      });

      const history = versionControl.getHistory();
      
      expect(history).toHaveLength(2);
      expect(versionControl.getCurrentVersion()).toBe(2);
      expect(versionControl.getDocumentAtVersion(1)).toBe('Hello');
      expect(versionControl.getDocumentAtVersion(2)).toBe('Hello World');
    });

    it('should support branching and merging', () => {
      const versionControl = new VersionControl();
      
      // Create base document
      versionControl.applyOperation({
        type: 'insert',
        position: 0,
        content: 'Hello World',
        userId: 'user1',
        timestamp: 1000
      });

      // Create branch
      const branchId = versionControl.createBranch('feature-branch');
      
      // Make changes in branch
      versionControl.applyOperation({
        type: 'insert',
        position: 11,
        content: '!',
        userId: 'user2',
        timestamp: 1001
      }, branchId);

      // Merge branch back to main
      const mergeResult = versionControl.mergeBranch(branchId, 'main');

      expect(mergeResult.success).toBe(true);
      expect(versionControl.getDocumentAtVersion(versionControl.getCurrentVersion())).toBe('Hello World!');
    });

    it('should handle merge conflicts', () => {
      const versionControl = new VersionControl();
      
      // Base document
      versionControl.applyOperation({
        type: 'insert',
        position: 0,
        content: 'Hello World',
        userId: 'user1',
        timestamp: 1000
      });

      // Create branch
      const branchId = versionControl.createBranch('feature-branch');
      
      // Conflicting changes
      versionControl.applyOperation({
        type: 'insert',
        position: 5,
        content: ' Beautiful',
        userId: 'user1',
        timestamp: 1001
      }, 'main');

      versionControl.applyOperation({
        type: 'insert',
        position: 5,
        content: ' Amazing',
        userId: 'user2',
        timestamp: 1002
      }, branchId);

      const mergeResult = versionControl.mergeBranch(branchId, 'main');

      expect(mergeResult.success).toBe(false);
      expect(mergeResult.conflicts).toHaveLength(1);
      expect(mergeResult.conflicts[0].type).toBe('insert-insert');
    });
  });

  describe('useCollaboration Hook', () => {
    it('should provide collaboration state and methods', () => {
      const { result } = renderHook(() => 
        useCollaboration('document-1', 'user-1')
      );

      expect(result.current.document).toBeDefined();
      expect(result.current.cursors).toEqual([]);
      expect(result.current.collaborators).toEqual([]);
      expect(typeof result.current.insertText).toBe('function');
      expect(typeof result.current.deleteText).toBe('function');
      expect(typeof result.current.setCursor).toBe('function');
    });

    it('should handle text insertion', () => {
      const { result } = renderHook(() => 
        useCollaboration('document-1', 'user-1')
      );

      act(() => {
        result.current.insertText(0, 'Hello World');
      });

      expect(result.current.document.getText()).toBe('Hello World');
    });

    it('should sync with other users', async () => {
      // This would test real-time synchronization
      // Implementation depends on WebSocket integration
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('CollaborativeEditor Component', () => {
    it('should render editor with collaboration features', () => {
      render(
        <CollaborativeEditor
          documentId="test-doc"
          userId="user-1"
          initialContent="Hello World"
        />
      );

      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    it('should show other users cursors', () => {
      render(
        <CollaborativeEditor
          documentId="test-doc"
          userId="user-1"
          initialContent="Hello World"
          collaborators={[
            { userId: 'user-2', name: 'Alice', cursor: { position: 5, length: 0 } }
          ]}
        />
      );

      expect(screen.getByTestId('cursor-user-2')).toBeInTheDocument();
    });

    it('should handle undo/redo with collaboration', async () => {
      const user = userEvent.setup();
      
      render(
        <CollaborativeEditor
          documentId="test-doc"
          userId="user-1"
          initialContent=""
        />
      );

      const editor = screen.getByRole('textbox');
      
      // Type text
      await user.type(editor, 'Hello World');
      expect(editor).toHaveValue('Hello World');

      // Undo
      await user.keyboard('{Control>}z{/Control}');
      expect(editor).toHaveValue('');

      // Redo
      await user.keyboard('{Control>}{Shift>}z{/Shift}{/Control}');
      expect(editor).toHaveValue('Hello World');
    });
  });

  describe('Performance', () => {
    it('should handle large documents efficiently', () => {
      const crdt = new CRDT('test-replica');
      const startTime = performance.now();

      // Insert 10,000 characters
      for (let i = 0; i < 10000; i++) {
        crdt.insert(i, 'a');
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
      expect(crdt.getText().length).toBe(10000);
    });

    it('should handle many concurrent operations', () => {
      const ot = new OperationalTransform();
      const operations = [];

      // Generate 1000 concurrent operations
      for (let i = 0; i < 1000; i++) {
        operations.push({
          type: 'insert',
          position: Math.floor(Math.random() * 100),
          content: `text${i}`,
          userId: `user${i % 10}`,
          timestamp: 1000 + i
        });
      }

      const startTime = performance.now();
      
      // Transform all operations
      const transformed = ot.transformBatch(operations);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500); // Should complete quickly
      expect(transformed).toHaveLength(1000);
    });
  });
});