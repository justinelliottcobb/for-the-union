import { TestResult } from '@/types';

export function runTests(compiledCode: string): TestResult[] {
  const results: TestResult[] = [];

  // Test 1: OperationalTransform class exists
  results.push({
    name: 'OperationalTransform Class Implementation',
    passed: compiledCode.includes('class OperationalTransform') && 
            compiledCode.includes('transform') && 
            compiledCode.includes('transformBatch') &&
            compiledCode.includes('compose'),
    message: compiledCode.includes('class OperationalTransform') ? 
      'OperationalTransform class properly defined with required methods' : 
      'OperationalTransform class is missing or incomplete. Should include transform, transformBatch, and compose methods'
  });

  // Test 2: CRDT class exists
  results.push({
    name: 'CRDT Class Implementation',
    passed: compiledCode.includes('class CRDT') && 
            compiledCode.includes('insert') && 
            compiledCode.includes('delete') &&
            compiledCode.includes('getText') &&
            compiledCode.includes('applyOperation'),
    message: compiledCode.includes('class CRDT') ? 
      'CRDT class properly defined with required methods' : 
      'CRDT class is missing or incomplete. Should include insert, delete, getText, and applyOperation methods'
  });

  // Test 3: ConflictResolver class exists
  results.push({
    name: 'ConflictResolver Class Implementation',
    passed: compiledCode.includes('class ConflictResolver') &&
            compiledCode.includes('detectConflicts') &&
            compiledCode.includes('resolve') &&
            compiledCode.includes('applyResolution'),
    message: compiledCode.includes('class ConflictResolver') ? 
      'ConflictResolver class properly defined with required methods' : 
      'ConflictResolver class is missing or incomplete. Should include detectConflicts, resolve, and applyResolution methods'
  });

  // Test 4: PresenceIndicator class exists
  results.push({
    name: 'PresenceIndicator Class Implementation',
    passed: compiledCode.includes('class PresenceIndicator') &&
            compiledCode.includes('updateUserCursor') &&
            compiledCode.includes('transformCursors') &&
            compiledCode.includes('getAllCursors'),
    message: compiledCode.includes('class PresenceIndicator') ? 
      'PresenceIndicator class properly defined with required methods' : 
      'PresenceIndicator class is missing or incomplete. Should include updateUserCursor, transformCursors, and getAllCursors methods'
  });

  // Test 5: VersionControl class exists
  results.push({
    name: 'VersionControl Class Implementation',
    passed: compiledCode.includes('class VersionControl') &&
            compiledCode.includes('applyOperation') &&
            compiledCode.includes('createBranch') &&
            compiledCode.includes('mergeBranch') &&
            compiledCode.includes('getHistory'),
    message: compiledCode.includes('class VersionControl') ? 
      'VersionControl class properly defined with required methods' : 
      'VersionControl class is missing or incomplete. Should include applyOperation, createBranch, mergeBranch, and getHistory methods'
  });

  // Test 6: useCollaboration hook exists
  results.push({
    name: 'useCollaboration Hook Implementation',
    passed: compiledCode.includes('useCollaboration') &&
            compiledCode.includes('insertText') &&
            compiledCode.includes('deleteText') &&
            compiledCode.includes('setCursor'),
    message: compiledCode.includes('useCollaboration') ? 
      'useCollaboration hook properly implemented' : 
      'useCollaboration hook is missing or incomplete. Should return insertText, deleteText, and setCursor functions'
  });

  // Test 7: CollaborativeEditor component exists
  results.push({
    name: 'CollaborativeEditor Component Implementation',
    passed: compiledCode.includes('CollaborativeEditor') &&
            compiledCode.includes('documentId') &&
            compiledCode.includes('userId') &&
            compiledCode.includes('textarea'),
    message: compiledCode.includes('CollaborativeEditor') ? 
      'CollaborativeEditor component properly implemented' : 
      'CollaborativeEditor component is missing or incomplete. Should include documentId, userId props and textarea element'
  });

  // Test 8: Operation transformation logic
  results.push({
    name: 'Operation Transformation Logic',
    passed: (compiledCode.includes('insert-insert') || compiledCode.includes('insertInsert')) &&
            (compiledCode.includes('delete-insert') || compiledCode.includes('deleteInsert')) &&
            compiledCode.includes('position'),
    message: compiledCode.includes('insert-insert') || compiledCode.includes('insertInsert') ? 
      'Operation transformation logic implemented for different operation types' : 
      'Operation transformation logic missing. Should handle insert-insert, delete-insert conflicts and position adjustments'
  });

  // Test 9: Conflict resolution strategies
  results.push({
    name: 'Conflict Resolution Strategies',
    passed: compiledCode.includes('last-writer-wins') ||
            compiledCode.includes('lastWriterWins') ||
            compiledCode.includes('merge') &&
            compiledCode.includes('ResolutionStrategy'),
    message: compiledCode.includes('last-writer-wins') || compiledCode.includes('lastWriterWins') ? 
      'Conflict resolution strategies implemented' : 
      'Conflict resolution strategies missing. Should include last-writer-wins, merge strategies'
  });

  // Test 10: Presence awareness with cursors
  results.push({
    name: 'Presence Awareness Implementation',
    passed: compiledCode.includes('UserCursor') &&
            compiledCode.includes('position') &&
            compiledCode.includes('userId') &&
            (compiledCode.includes('color') || compiledCode.includes('name')),
    message: compiledCode.includes('UserCursor') ? 
      'Presence awareness implemented with user cursors' : 
      'Presence awareness missing. Should include UserCursor interface with position, userId, color/name properties'
  });

  // Test 11: CRDT character management
  results.push({
    name: 'CRDT Character Management',
    passed: compiledCode.includes('CRDTChar') &&
            compiledCode.includes('deleted') &&
            compiledCode.includes('timestamp') &&
            compiledCode.includes('replicaId'),
    message: compiledCode.includes('CRDTChar') ? 
      'CRDT character management implemented' : 
      'CRDT character management missing. Should include CRDTChar interface with deleted, timestamp, replicaId properties'
  });

  // Test 12: Undo/Redo functionality
  results.push({
    name: 'Undo/Redo Functionality',
    passed: compiledCode.includes('undo') &&
            compiledCode.includes('redo') &&
            (compiledCode.includes('undoStack') || compiledCode.includes('redoStack') || compiledCode.includes('Stack')),
    message: compiledCode.includes('undo') && compiledCode.includes('redo') ? 
      'Undo/Redo functionality implemented' : 
      'Undo/Redo functionality missing. Should include undo, redo functions and stack management'
  });

  return results;
}