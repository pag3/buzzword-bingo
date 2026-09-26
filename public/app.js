const { useState } = React;
const h = React.createElement;

function shuffle(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const BUZZWORDS = [
  'Synergy', 'Disruptive', 'Blockchain', 'Leverage', 'IoT',
  'AI', 'Big Data', 'Cloud', 'Agile', 'Low-Hanging Fruit',
  'Paradigm', 'KPI', 'Deep Dive', 'Ecosystem', 'Lean',
  'Pivot', 'Scalable', 'Touch Base', 'Bandwidth', 'Bleeding Edge',
  'Circle Back', 'Pain Point', 'Growth Hacking', 'Granular', 'Win-Win'
];

function generateBoard() {
  const shuffled = shuffle(BUZZWORDS);
  const board = [];
  let index = 0;
  for (let i = 0; i < 5; i++) {
    const row = [];
    for (let j = 0; j < 5; j++) {
      if (i === 2 && j === 2) {
        row.push('FREE');
      } else {
        row.push(shuffled[index++]);
      }
    }
    board.push(row);
  }
  return board;
}

function checkBingo(marked) {
  for (let i = 0; i < 5; i++) {
    if (marked[i].every(Boolean)) return true;
    if (marked.every(row => row[i])) return true;
  }
  if (marked.every((row, i) => row[i])) return true;
  if (marked.every((row, i) => row[4 - i])) return true;
  return false;
}

function initialMarked() {
  return Array.from({ length: 5 }, (_, i) =>
    Array.from({ length: 5 }, (_, j) => i === 2 && j === 2)
  );
}

function BingoGame() {
  const [board, setBoard] = useState(generateBoard);
  const [marked, setMarked] = useState(initialMarked);

  function toggle(i, j) {
    if (i === 2 && j === 2) return; // FREE square stays marked
    setMarked(prev => {
      const next = prev.map(row => row.slice());
      next[i][j] = !next[i][j];
      return next;
    });
  }

  function reset() {
    setBoard(generateBoard());
    setMarked(initialMarked());
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
