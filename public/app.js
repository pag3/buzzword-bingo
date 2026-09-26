const { useState, useEffect } = React;
const h = React.createElement;
const { checkBingo, isFree, newGame, parseSavedGame } = BingoLogic;

// The current board is saved in localStorage so a reload, or the OS closing
// the app in the background, doesn't lose progress mid-meeting. Storage can be
// unavailable (private browsing, blocked site data), so failures are ignored
// and the game simply isn't saved.
const STORAGE_KEY = 'buzzword-bingo:game';

function loadGame() {
  try {
    return parseSavedGame(localStorage.getItem(STORAGE_KEY)) || newGame();
  } catch {
    return newGame();
  }
}

function saveGame(game) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
  } catch {
    // Not saved; the game still works.
  }
}

function BingoGame() {
  const [game, setGame] = useState(loadGame);
  const { board, marked } = game;

  useEffect(() => saveGame(game), [game]);

  function toggle(i, j) {
    if (isFree(i, j)) return; // FREE square stays marked
    setGame(prev => {
      const next = prev.marked.map(row => row.slice());
      next[i][j] = !next[i][j];
      return { board: prev.board, marked: next };
    });
  }

  function reset() {
    setGame(newGame());
  }

  return h('div', null,
    h('h1', null, 'Buzzword Bingo'),
    h('div', { className: 'bingo-board' },
      board.map((row, i) =>
        row.map((word, j) =>
          h('div', {
            key: `${i}-${j}`,
            className: 'square' + (marked[i][j] ? ' selected' : ''),
            onClick: () => toggle(i, j)
          }, word)
        )
      )
    ),
    h('button', { onClick: reset }, 'New Board'),
    h('div', { id: 'message' }, checkBingo(marked) ? 'Bingo!' : '')
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(h(BingoGame));

// Offline support for the web/PWA build. The desktop (Tauri) and mobile
// (Capacitor) apps already bundle every file, so they skip it.
const inAppShell = '__TAURI_INTERNALS__' in window || 'Capacitor' in window;
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !inAppShell) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(err => {
      console.warn('Service worker registration failed:', err);
    });
  });
}
