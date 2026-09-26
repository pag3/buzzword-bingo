// Pure game logic, with no React or DOM. The browser loads it as a plain
// script (exposing `BingoLogic`); Node loads it with require() for the tests.
(function (root, factory) {
  const logic = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = logic;
  } else {
    root.BingoLogic = logic;
  }
})(typeof self !== 'undefined' ? self : this, function () {
  const SIZE = 5;
  const CENTER = 2;
  const FREE = 'FREE';

  const BUZZWORDS = [
    'Synergy', 'Disruptive', 'Blockchain', 'Leverage', 'IoT',
    'AI', 'Big Data', 'Cloud', 'Agile', 'Low-Hanging Fruit',
    'Paradigm', 'KPI', 'Deep Dive', 'Ecosystem', 'Lean',
    'Pivot', 'Scalable', 'Touch Base', 'Bandwidth', 'Bleeding Edge',
    'Circle Back', 'Pain Point', 'Growth Hacking', 'Granular', 'Win-Win',
    'Move the Needle', 'Deliverables', 'Stakeholder', 'Alignment', 'Actionable',
    'Best Practice', 'Boil the Ocean', 'Core Competency', 'Double-Click', 'Drill Down',
    'Empower', 'Game Changer', 'Holistic', 'Ideate', 'Mindshare',
    'North Star', 'Bottleneck', 'Onboarding', 'Optics', 'Evergreen',
    'Parking Lot', 'Ping Me', 'Quick Win', 'Reach Out', 'Robust',
    'ROI', 'Blue Sky', 'Seamless', 'Secret Sauce', 'Silo',
    'Streamline', 'Take It Offline', 'Thought Leader', 'Unpack', 'Value Add',
    'Moving Forward', 'Hard Stop', 'Heavy Lifting', 'Level Set', 'Deck',
    'Q4', 'Roadmap', 'Sprint', 'MVP', 'Tiger Team',
    'Net-Net', 'Table Stakes', 'Bake In', 'Buy-In', 'Wheelhouse',
    'Headwinds', 'Tailwinds', 'Learnings', 'Swim Lane', 'Hockey Stick',
    'Cadence', 'Hyperscale', 'Omnichannel', 'Mission-Critical', 'Next Level',
    'Out of Pocket', 'Rockstar', 'Sunset', 'Customer-Centric', 'Guardrails'
  ];

  function shuffle(array, random = Math.random) {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function isFree(i, j) {
    return i === CENTER && j === CENTER;
  }

  function generateBoard(words = BUZZWORDS, random = Math.random) {
    const shuffled = shuffle(words, random);
    const board = [];
    let index = 0;
    for (let i = 0; i < SIZE; i++) {
      const row = [];
      for (let j = 0; j < SIZE; j++) {
        row.push(isFree(i, j) ? FREE : shuffled[index++]);
      }
      board.push(row);
    }
    return board;
  }

  // Every complete line, as a list of [row, column] cells: each row, each
  // column, then the two diagonals.
  function winningLines(marked) {
    const range = Array.from({ length: SIZE }, (_, k) => k);
    const lines = [
      ...range.map(i => range.map(j => [i, j])),
      ...range.map(j => range.map(i => [i, j])),
      range.map(k => [k, k]),
      range.map(k => [k, SIZE - 1 - k])
    ];
    return lines.filter(line => line.every(([i, j]) => marked[i][j]));
  }

  function checkBingo(marked) {
    return winningLines(marked).length > 0;
  }

  // The message shown for a given number of complete lines.
  function bingoMessage(lineCount) {
    if (lineCount === 0) return '';
    const names = ['Bingo!', 'Double Bingo!', 'Triple Bingo!'];
    return names[lineCount - 1] || `${lineCount}× Bingo!`;
  }

  function initialMarked() {
    return Array.from({ length: SIZE }, (_, i) =>
      Array.from({ length: SIZE }, (_, j) => isFree(i, j))
    );
  }

  // Whether starting a new board would throw away progress worth asking about:
  // at least one square marked besides FREE, and no Bingo yet. After a Bingo
  // the game is effectively over, so starting over needs no confirmation.
  function needsResetConfirmation(marked) {
    const anyMarked = marked.some((row, i) => row.some((cell, j) => cell && !isFree(i, j)));
    return anyMarked && winningLines(marked).length === 0;
  }

  function newGame() {
    return { board: generateBoard(), marked: initialMarked() };
  }

  function isGrid(value, isCell) {
    return Array.isArray(value) && value.length === SIZE &&
      value.every(row => Array.isArray(row) && row.length === SIZE && row.every(isCell));
  }

  // Turns saved JSON back into a game, or returns null if it is missing,
  // corrupt, or no longer valid (for example, it uses a word that has since
  // been removed from `words`).
  function parseSavedGame(json, words = BUZZWORDS) {
    let saved;
    try {
      saved = JSON.parse(json);
    } catch {
      return null;
    }
    if (!saved || !isGrid(saved.board, cell => typeof cell === 'string') ||
        !isGrid(saved.marked, cell => typeof cell === 'boolean')) {
      return null;
    }
    const { board, marked } = saved;
    const valid = new Set(words);
    const cells = board.flat().filter((_, k) => !isFree(Math.floor(k / SIZE), k % SIZE));
    if (board[CENTER][CENTER] !== FREE || !marked[CENTER][CENTER] ||
        !cells.every(word => valid.has(word)) || new Set(cells).size !== cells.length) {
      return null;
    }
    return { board, marked };
  }

  return {
    SIZE, FREE, BUZZWORDS, shuffle, isFree, generateBoard, winningLines, checkBingo,
    bingoMessage, initialMarked, needsResetConfirmation, newGame, parseSavedGame
  };
});
