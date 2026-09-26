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
    'Circle Back', 'Pain Point', 'Growth Hacking', 'Granular', 'Win-Win'
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

  return {
    SIZE, FREE, BUZZWORDS, shuffle, isFree, generateBoard, winningLines, checkBingo,
    bingoMessage, initialMarked
  };
});
