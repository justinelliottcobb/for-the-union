// GADTs and Type-Safe State Machines - Solution
import React, { useState } from 'react';

// GADT-style Network Connection State Machine
type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

type Connection<S extends ConnectionStatus> = {
  status: S;
  data: ConnectionData<S>;
};

type ConnectionData<S extends ConnectionStatus> = 
  S extends 'disconnected' ? {} :
  S extends 'connecting' ? { startTime: number } :
  S extends 'connected' ? { socket: WebSocket | null; connectedAt: number } :
  S extends 'error' ? { error: string; lastAttempt: number } :
  never;

// GADT constructors - each returns specific type
const createConnection = (): Connection<'disconnected'> => ({
  status: 'disconnected',
  data: {}
});

const startConnection = (conn: Connection<'disconnected'>): Connection<'connecting'> => ({
  status: 'connecting',
  data: { startTime: Date.now() }
});

const finishConnection = (
  conn: Connection<'connecting'>,
  socket: WebSocket | null = null
): Connection<'connected'> => ({
  status: 'connected',
  data: { socket, connectedAt: Date.now() }
});

const connectionError = (
  conn: Connection<'connecting'>,
  error: string
): Connection<'error'> => ({
  status: 'error',
  data: { error, lastAttempt: Date.now() }
});

const disconnect = <S extends 'connected' | 'error'>(
  conn: Connection<S>
): Connection<'disconnected'> => ({
  status: 'disconnected',
  data: {}
});

// Operations only available in specific states
const sendData = (conn: Connection<'connected'>, data: string): void => {
  console.log(`Sending: ${data} via socket`);
  // conn.data.socket is guaranteed to exist
};

const getConnectionTime = (conn: Connection<'connected'>): number => {
  return Date.now() - conn.data.connectedAt;
};

// Document Editor GADT
type DocumentStatus = 'clean' | 'dirty' | 'saving' | 'error';

type Document<S extends DocumentStatus> = {
  status: S;
  content: string;
  metadata: DocumentMetadata<S>;
};

type DocumentMetadata<S extends DocumentStatus> =
  S extends 'clean' ? { savedAt: number } :
  S extends 'dirty' ? { lastEdit: number; hasUnsavedChanges: true } :
  S extends 'saving' ? { savingStarted: number; previousContent: string } :
  S extends 'error' ? { error: string; lastSaveAttempt: number } :
  never;

const createDocument = (content: string = ''): Document<'clean'> => ({
  status: 'clean',
  content,
  metadata: { savedAt: Date.now() }
});

const editDocument = (
  doc: Document<'clean'>,
  newContent: string
): Document<'dirty'> => ({
  status: 'dirty',
  content: newContent,
  metadata: { lastEdit: Date.now(), hasUnsavedChanges: true }
});

const startSaving = (doc: Document<'dirty'>): Document<'saving'> => ({
  status: 'saving',
  content: doc.content,
  metadata: { savingStarted: Date.now(), previousContent: doc.content }
});

const finishSaving = (doc: Document<'saving'>): Document<'clean'> => ({
  status: 'clean',
  content: doc.content,
  metadata: { savedAt: Date.now() }
});

// Game State GADT
type GameStatus = 'menu' | 'playing' | 'paused' | 'gameOver';
type Player = 'player1' | 'player2';

type Game<S extends GameStatus, P extends Player = 'player1'> = {
  status: S;
  currentPlayer: P;
  data: GameData<S>;
};

type GameData<S extends GameStatus> =
  S extends 'menu' ? { selectedMode: string } :
  S extends 'playing' ? { score: number; turn: number } :
  S extends 'paused' ? { pausedAt: number; score: number } :
  S extends 'gameOver' ? { finalScore: number; winner?: Player } :
  never;

const createGame = (): Game<'menu'> => ({
  status: 'menu',
  currentPlayer: 'player1',
  data: { selectedMode: 'standard' }
});

const startGame = (game: Game<'menu'>): Game<'playing', 'player1'> => ({
  status: 'playing',
  currentPlayer: 'player1',
  data: { score: 0, turn: 1 }
});

const makeMove = <P extends Player>(
  game: Game<'playing', P>
): Game<'playing', P extends 'player1' ? 'player2' : 'player1'> => ({
  status: 'playing',
  currentPlayer: game.currentPlayer === 'player1' ? 'player2' : 'player1',
  data: { ...game.data, turn: game.data.turn + 1 }
} as any); // Type assertion needed due to TypeScript limitations

// Interactive Component
export const GADTDemo: React.FC = () => {
  const [connectionState, setConnectionState] = useState<ConnectionStatus>('disconnected');
  const [docState, setDocState] = useState<DocumentStatus>('clean');
  const [docContent, setDocContent] = useState('Hello, World!');
  const [gameState, setGameState] = useState<GameStatus>('menu');
  const [currentPlayer, setCurrentPlayer] = useState<Player>('player1');

  let connection: Connection<any> = createConnection();
  let document: Document<any> = createDocument(docContent);
  let game: Game<any> = createGame();

  const handleConnectionAction = (action: string) => {
    switch (action) {
      case 'connect':
        if (connectionState === 'disconnected') {
          connection = startConnection(connection);
          setConnectionState('connecting');
          
          // Simulate connection
          setTimeout(() => {
            connection = finishConnection(connection);
            setConnectionState('connected');
          }, 1000);
        }
        break;
      case 'disconnect':
        if (connectionState === 'connected' || connectionState === 'error') {
          connection = disconnect(connection);
          setConnectionState('disconnected');
        }
        break;
    }
  };

  const handleDocAction = (action: string) => {
    switch (action) {
      case 'edit':
        if (docState === 'clean') {
          document = editDocument(document, docContent + ' [edited]');
          setDocState('dirty');
          setDocContent(docContent + ' [edited]');
        }
        break;
      case 'save':
        if (docState === 'dirty') {
          document = startSaving(document);
          setDocState('saving');
          
          // Simulate save
          setTimeout(() => {
            document = finishSaving(document);
            setDocState('clean');
          }, 1000);
        }
        break;
    }
  };

  const handleGameAction = (action: string) => {
    switch (action) {
      case 'start':
        if (gameState === 'menu') {
          game = startGame(game);
          setGameState('playing');
          setCurrentPlayer('player1');
        }
        break;
      case 'move':
        if (gameState === 'playing') {
          game = makeMove(game);
          setCurrentPlayer(currentPlayer === 'player1' ? 'player2' : 'player1');
        }
        break;
      case 'menu':
        game = createGame();
        setGameState('menu');
        setCurrentPlayer('player1');
        break;
    }
  };

  return (
    <div>
      <h3>GADTs and Type-Safe State Machines</h3>
      
      <div>
        <h4>Network Connection (Status: {connectionState})</h4>
        <button 
          onClick={() => handleConnectionAction('connect')}
          disabled={connectionState !== 'disconnected'}
        >
          Connect
        </button>
        <button 
          onClick={() => handleConnectionAction('disconnect')}
          disabled={connectionState !== 'connected' && connectionState !== 'error'}
        >
          Disconnect
        </button>
        {connectionState === 'connected' && (
          <button onClick={() => sendData(connection, 'test')}>
            Send Data
          </button>
        )}
      </div>

      <div>
        <h4>Document Editor (Status: {docState})</h4>
        <p>Content: {docContent}</p>
        <button 
          onClick={() => handleDocAction('edit')}
          disabled={docState !== 'clean'}
        >
          Edit
        </button>
        <button 
          onClick={() => handleDocAction('save')}
          disabled={docState !== 'dirty'}
        >
          Save
        </button>
      </div>

      <div>
        <h4>Game State (Status: {gameState}, Current Player: {currentPlayer})</h4>
        <button 
          onClick={() => handleGameAction('start')}
          disabled={gameState !== 'menu'}
        >
          Start Game
        </button>
        <button 
          onClick={() => handleGameAction('move')}
          disabled={gameState !== 'playing'}
        >
          Make Move
        </button>
        <button onClick={() => handleGameAction('menu')}>
          Back to Menu
        </button>
      </div>
    </div>
  );
};

export default GADTDemo;