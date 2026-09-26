const { useState, useEffect } = React;
const h = React.createElement;
const { winningLines, bingoMessage, isFree, newGame, parseSavedGame } = BingoLogic;

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

  const lines = winningLines(marked);
  const winning = new Set(lines.flat().map(([i, j]) => `${i}-${j}`));

  return h('div', null,
    h('h1', null, 'Buzzword Bingo'),
    h('div', { className: 'bingo-board', role: 'group', 'aria-label': 'Bingo board' },
      board.map((row, i) =>
        row.map((word, j) => {
          const free = isFree(i, j);
          return h('button', {
            key: `${i}-${j}`,
            type: 'button',
            className: 'square' + (marked[i][j] ? ' selected' : '') +
              (winning.has(`${i}-${j}`) ? ' winning' : ''),
            'aria-pressed': marked[i][j],
            // The FREE square is always marked, so it can't be toggled. It
            // stays focusable (unlike `disabled`) so screen readers still
            // announce it as part of the board.
            'aria-disabled': free || undefined,
            'aria-label': free ? 'Free square, always marked' : undefined,
            onClick: () => toggle(i, j)
          }, word);
        })
      )
    ),
    h('button', { type: 'button', className: 'new-board', onClick: reset }, 'New Board'),
    // The inner span is keyed on the line count so its pop animation replays
    // for each new line, while #message itself stays in place.
    h('div', { id: 'message', role: 'status' },
      lines.length > 0 && h('span', { key: lines.length, className: 'win' }, bingoMessage(lines.length)))
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
