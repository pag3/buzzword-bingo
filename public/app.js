const { useState, useEffect, useMemo } = React;
const h = React.createElement;
const {
  winningLines, bingoMessage, isFree, needsResetConfirmation, newGame, parseSavedGame
} = BingoLogic;

// The current board is saved in localStorage so a reload, or the OS closing
// the app in the background, doesn't lose progress mid-meeting. Storage can be
// unavailable (private browsing, blocked site data), so failures are ignored
// and the game simply isn't saved.
const STORAGE_KEY = 'buzzword-bingo:game';

// How long "New Board" waits for the second press before going back to normal.
const CONFIRM_MS = 3000;

// A tongue-in-cheek subtitle, picked afresh for each board.
const TAGLINES = [
  'Leveraging synergies since Q4.',
  'Let\u2019s take this offline\u2026 and win.',
  'Moving the needle, one square at a time.',
  'Per my last email: mark your squares.',
  'This meeting could have been a bingo card.',
  'Circling back to the low-hanging fruit.',
  'Now with 30% more thought leadership.',
  'A best-in-class, customer-centric bingo experience.'
];

const COLUMN_LETTERS = ['B', 'I', 'N', 'G', 'O'];
const CONFETTI_COLORS = ['#ff4f9a', '#ff8a3d', '#ffd23f', '#2ec4b6', '#7b5cff'];
const CONFETTI_PIECES = 60;

// Randomised confetti pieces. Positions are set as CSS custom properties
// (through the CSSOM, so the Content Security Policy allows them).
function makeConfetti() {
  return Array.from({ length: CONFETTI_PIECES }, (_, k) => ({
    '--x': `${Math.random() * 100}vw`,
    '--drift': `${(Math.random() - 0.5) * 30}vw`,
    '--spin': `${(Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 720)}deg`,
    '--delay': `${Math.random() * 0.6}s`,
    '--duration': `${2.2 + Math.random() * 1.6}s`,
    '--color': CONFETTI_COLORS[k % CONFETTI_COLORS.length]
  }));
}

function Confetti() {
  const pieces = useMemo(makeConfetti, []);
  return h('div', { className: 'confetti', 'aria-hidden': true },
    pieces.map((style, k) => h('span', { key: k, style })));
}

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

  // Starting over mid-game takes two presses of New Board, so a stray tap
  // can't wipe progress that now survives reloads.
  const [confirming, setConfirming] = useState(false);

  useEffect(() => saveGame(game), [game]);

  useEffect(() => {
    if (!confirming) return undefined;
    const timer = setTimeout(() => setConfirming(false), CONFIRM_MS);
    return () => clearTimeout(timer);
  }, [confirming]);

  function toggle(i, j) {
    if (isFree(i, j)) return; // FREE square stays marked
    setConfirming(false);
    setGame(prev => {
      const next = prev.marked.map(row => row.slice());
      next[i][j] = !next[i][j];
      return { board: prev.board, marked: next };
    });
  }

  function reset() {
    if (!confirming && needsResetConfirmation(marked)) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    setGame(newGame());
  }

  // Keyed on the board so it changes with each New Board, not each tap.
  const tagline = useMemo(
    () => TAGLINES[Math.floor(Math.random() * TAGLINES.length)], [board]);

  const lines = winningLines(marked);
  const winning = new Set(lines.flat().map(([i, j]) => `${i}-${j}`));

  return h('div', { className: 'game' },
    h('header', { className: 'masthead' },
      h('h1', null,
        h('span', { className: 'title-buzz' }, 'Buzzword'), ' ',
        h('span', { className: 'title-bingo' }, 'Bingo')),
      h('p', { className: 'tagline' }, tagline)),
    h('div', { className: 'card' },
    h('div', { className: 'column-letters', 'aria-hidden': true },
      COLUMN_LETTERS.map(letter => h('span', { key: letter }, letter))),
    h('div', { className: 'bingo-board', role: 'group', 'aria-label': 'Bingo board' },
      board.map((row, i) =>
        row.map((word, j) => {
          const free = isFree(i, j);
          return h('button', {
            key: `${i}-${j}`,
            type: 'button',
            className: 'square' + (marked[i][j] ? ' selected' : '') +
              (winning.has(`${i}-${j}`) ? ' winning' : '') + (free ? ' free' : ''),
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
    )),
    h('button', {
      type: 'button',
      className: 'new-board' + (confirming ? ' confirming' : ''),
      onClick: reset
    }, confirming ? 'Press again for a new board' : 'New Board'),
    // The inner span is keyed on the line count so its pop animation replays
    // for each new line, while #message itself stays in place. While New Board
    // is waiting for its second press (never during a Bingo), the status
    // explains what it will do, which also announces it to screen readers.
    h('div', { id: 'message', role: 'status' },
      confirming
        ? h('span', { className: 'confirm-hint' }, 'Your marked squares will be cleared.')
        : lines.length > 0 && h('span', { key: lines.length, className: 'win' }, bingoMessage(lines.length))),
    // A fresh burst for each new line.
    lines.length > 0 && h(Confetti, { key: `confetti-${lines.length}` })
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
