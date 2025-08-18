import { TestResult } from '@/types';

export function runTests(compiledCode: string): TestResult[] {
  const results: TestResult[] = [];

  // Test 1: OperationalTransform class implementation
  results.push({
    name: 'OperationalTransform Class Implementation',
    passed: compiledCode.includes('class OperationalTransform') && 
            !compiledCode.includes('// TODO: Implement operation transformation logic') &&
            !compiledCode.includes('return [op1, op2]; // Placeholder') &&
            (compiledCode.includes('insert-insert') || compiledCode.includes('insertInsert')) &&
            compiledCode.includes('position') &&
            !compiledCode.includes('// Example cases to handle:'),
    error: (!compiledCode.includes('class OperationalTransform')) ? 
      'OperationalTransform class is missing' :
      (compiledCode.includes('// TODO: Implement operation transformation logic') || compiledCode.includes('return [op1, op2]; // Placeholder')) ?
      'OperationalTransform transform method needs actual implementation' :
      'OperationalTransform missing insert-insert conflict handling and position adjustment logic',
    executionTime: 1
  });

  // Test 2: CRDT class implementation
  results.push({
    name: 'CRDT Class Implementation',
    passed: compiledCode.includes('class CRDT') && 
            !compiledCode.includes('// TODO: Initialize CRDT with replica ID') &&
            !compiledCode.includes('// TODO: Create insert operation') &&
            !compiledCode.includes('return { type: \'insert\', position, content, userId: \'\', timestamp: Date.now() }; // Placeholder') &&
            compiledCode.includes('replicaId') &&
            compiledCode.includes('characters') &&
            compiledCode.includes('CRDTChar'),
    error: (!compiledCode.includes('class CRDT')) ? 
      'CRDT class is missing' :
      (compiledCode.includes('// TODO: Initialize CRDT with replica ID') || compiledCode.includes('// TODO: Create insert operation')) ?
      'CRDT class needs actual implementation in constructor and methods' :
      'CRDT class missing replicaId, characters array, and CRDTChar usage',
    executionTime: 1
  });

  // Test 3: ConflictResolver class implementation
  results.push({
    name: 'ConflictResolver Class Implementation',
    passed: compiledCode.includes('class ConflictResolver') &&
            !compiledCode.includes('// TODO: Implement conflict detection') &&
            !compiledCode.includes('// TODO: Resolve conflicts based on strategy') &&
            compiledCode.includes('last-writer-wins') &&
            compiledCode.includes('ResolutionStrategy') &&
            compiledCode.includes('timestamp'),
    error: (!compiledCode.includes('class ConflictResolver')) ? 
      'ConflictResolver class is missing' :
      (compiledCode.includes('// TODO: Implement conflict detection') || compiledCode.includes('// TODO: Resolve conflicts based on strategy')) ?
      'ConflictResolver needs actual conflict detection and resolution implementation' :
      'ConflictResolver missing last-writer-wins strategy and timestamp-based resolution',
    executionTime: 1
  });

  // Test 4: PresenceIndicator class exists
  results.push({
    name: 'PresenceIndicator Class Implementation',
    passed: compiledCode.includes('class PresenceIndicator') &&
            compiledCode.includes('updateUserCursor') &&
            compiledCode.includes('transformCursors') &&
            compiledCode.includes('getAllCursors'),
    error: compiledCode.includes('class PresenceIndicator') ? 
      undefined : 
      'PresenceIndicator class is missing or incomplete. Should include updateUserCursor, transformCursors, and getAllCursors methods',
    executionTime: 1
  });

  // Test 5: VersionControl class exists
  results.push({
    name: 'VersionControl Class Implementation',
    passed: compiledCode.includes('class VersionControl') &&
            compiledCode.includes('applyOperation') &&
            compiledCode.includes('createBranch') &&
            compiledCode.includes('mergeBranch') &&
            compiledCode.includes('getHistory'),
    error: compiledCode.includes('class VersionControl') ? 
      undefined : 
      'VersionControl class is missing or incomplete. Should include applyOperation, createBranch, mergeBranch, and getHistory methods',
    executionTime: 1
  });

  // Test 6: useCollaboration hook exists
  results.push({
    name: 'useCollaboration Hook Implementation',
    passed: compiledCode.includes('useCollaboration') &&
            compiledCode.includes('insertText') &&
            compiledCode.includes('deleteText') &&
            compiledCode.includes('setCursor'),
    error: compiledCode.includes('useCollaboration') ? 
      undefined : 
      'useCollaboration hook is missing or incomplete. Should return insertText, deleteText, and setCursor functions',
    executionTime: 1
  });

  // Test 7: CollaborativeEditor component exists
  results.push({
    name: 'CollaborativeEditor Component Implementation',
    passed: compiledCode.includes('CollaborativeEditor') &&
            compiledCode.includes('documentId') &&
            compiledCode.includes('userId') &&
            compiledCode.includes('textarea'),
    error: compiledCode.includes('CollaborativeEditor') ? 
      undefined : 
      'CollaborativeEditor component is missing or incomplete. Should include documentId, userId props and textarea element',
    executionTime: 1
  });

  // Test 8: Operation transformation logic
  results.push({
    name: 'Operation Transformation Logic',
    passed: (compiledCode.includes('insert-insert') || compiledCode.includes('insertInsert')) &&
            (compiledCode.includes('delete-insert') || compiledCode.includes('deleteInsert')) &&
            compiledCode.includes('position'),
    error: (compiledCode.includes('insert-insert') || compiledCode.includes('insertInsert')) ? 
      undefined : 
      'Operation transformation logic missing. Should handle insert-insert, delete-insert conflicts and position adjustments',
    executionTime: 1
  });

  // Test 9: Conflict resolution strategies
  results.push({
    name: 'Conflict Resolution Strategies',
    passed: compiledCode.includes('last-writer-wins') ||
            compiledCode.includes('lastWriterWins') ||
            compiledCode.includes('merge') &&
            compiledCode.includes('ResolutionStrategy'),
    error: (compiledCode.includes('last-writer-wins') || compiledCode.includes('lastWriterWins')) ? 
      undefined : 
      'Conflict resolution strategies missing. Should include last-writer-wins, merge strategies',
    executionTime: 1
  });

  // Test 10: Presence awareness with cursors
  results.push({
    name: 'Presence Awareness Implementation',
    passed: compiledCode.includes('UserCursor') &&
            compiledCode.includes('position') &&
            compiledCode.includes('userId') &&
            (compiledCode.includes('color') || compiledCode.includes('name')),
    error: compiledCode.includes('UserCursor') ? 
      undefined : 
      'Presence awareness missing. Should include UserCursor interface with position, userId, color/name properties',
    executionTime: 1
  });

  // Test 11: CRDT character management
  results.push({
    name: 'CRDT Character Management',
    passed: compiledCode.includes('CRDTChar') &&
            compiledCode.includes('deleted') &&
            compiledCode.includes('timestamp') &&
            compiledCode.includes('replicaId'),
    error: compiledCode.includes('CRDTChar') ? 
      undefined : 
      'CRDT character management missing. Should include CRDTChar interface with deleted, timestamp, replicaId properties',
    executionTime: 1
  });

  // Test 12: Undo/Redo functionality
  results.push({
    name: 'Undo/Redo Functionality',
    passed: compiledCode.includes('undo') &&
            compiledCode.includes('redo') &&
            (compiledCode.includes('undoStack') || compiledCode.includes('redoStack') || compiledCode.includes('Stack')),
    error: (compiledCode.includes('undo') && compiledCode.includes('redo')) ? 
      undefined : 
      'Undo/Redo functionality missing. Should include undo, redo functions and stack management',
    executionTime: 1
  });

  return results;
}