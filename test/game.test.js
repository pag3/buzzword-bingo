const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  SIZE, FREE, BUZZWORDS, shuffle, generateBoard, winningLines, checkBingo, bingoMessage,
  initialMarked
} = require('../public/game.js');

// A board where only the given [row, column] squares (plus FREE) are marked.
function markedWith(cells) {
  const marked = initialMarked();
  for (const [i, j] of cells) marked[i][j] = true;
  return marked;
}

const range = Array.from({ length: SIZE }, (_, k) => k);

test('every row is a win', () => {
  for (const i of range) {
    assert.equal(checkBingo(markedWith(range.map(j => [i, j]))), true, `row ${i}`);
  }
});

test('every column is a win', () => {
  for (const j of range) {
    assert.equal(checkBingo(markedWith(range.map(i => [i, j]))), true, `column ${j}`);
  }
});

test('both diagonals are wins', () => {
  assert.equal(checkBingo(markedWith(range.map(k => [k, k]))), true);
  assert.equal(checkBingo(markedWith(range.map(k => [k, SIZE - 1 - k]))), true);
});

test('a board with only FREE marked is not a win', () => {
  assert.equal(checkBingo(initialMarked()), false);
});

test('an incomplete line is not a win', () => {
  assert.equal(checkBingo(markedWith([[0, 0], [0, 1], [0, 2], [0, 3]])), false);
  assert.equal(checkBingo(markedWith([[0, 0], [1, 1], [3, 3]])), false);
});

test('scattered marks with no complete line are not a win', () => {
  const marked = markedWith([
    [0, 0], [0, 1], [0, 2], [0, 3],
    [1, 4], [2, 4], [3, 4],
    [4, 0], [3, 1], [1, 3]
  ]);
  assert.equal(checkBingo(marked), false);
});

test('initialMarked marks only the centre square', () => {
  const marked = initialMarked();
  assert.equal(marked.length, SIZE);
  for (const i of range) {
    for (const j of range) {
      assert.equal(marked[i][j], i === 2 && j === 2, `[${i}, ${j}]`);
    }
  }
});

test('generateBoard is 5x5 with FREE only in the centre', () => {
  const board = generateBoard();
  assert.equal(board.length, SIZE);
  for (const row of board) assert.equal(row.length, SIZE);
  assert.equal(board[2][2], FREE);
  assert.equal(board.flat().filter(word => word === FREE).length, 1);
});

test('generateBoard uses buzzwords without duplicates', () => {
  for (let n = 0; n < 50; n++) {
    const words = generateBoard().flat().filter(word => word !== FREE);
    assert.equal(words.length, SIZE * SIZE - 1);
    assert.equal(new Set(words).size, words.length);
    for (const word of words) assert.ok(BUZZWORDS.includes(word), word);
  }
});

test('BUZZWORDS has enough unique words to fill a board', () => {
  assert.equal(new Set(BUZZWORDS).size, BUZZWORDS.length);
  assert.ok(BUZZWORDS.length >= SIZE * SIZE - 1);
});

test('BUZZWORDS is large enough that boards vary', () => {
  // Each board uses 24 words, so a list several times that size means two
  // boards in a row share only a fraction of their words.
  assert.ok(BUZZWORDS.length >= 75, `only ${BUZZWORDS.length} buzzwords`);
});

test('BUZZWORDS has no near-duplicates that differ only in case', () => {
  const lower = BUZZWORDS.map(word => word.toLowerCase());
  assert.equal(new Set(lower).size, lower.length);
});

test('every buzzword is short enough to fit in a square', () => {
  for (const word of BUZZWORDS) assert.ok(word.length <= 20, word);
});

test('two boards from different random sequences share fewer than half their words', () => {
  // Deterministic sources so the test can't flake.
  const lcg = seed => () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const a = new Set(generateBoard(BUZZWORDS, lcg(1)).flat());
  const b = generateBoard(BUZZWORDS, lcg(2)).flat();
  const shared = b.filter(word => a.has(word)).length;
  assert.ok(shared <= 12, `boards share ${shared} of 25 squares`);
});

test('shuffle returns a permutation and leaves the input unchanged', () => {
  const input = [1, 2, 3, 4, 5, 6];
  const copy = input.slice();
  const result = shuffle(input);
  assert.deepEqual(input, copy);
  assert.deepEqual(result.slice().sort(), copy);
});

test('shuffle follows the supplied random source', () => {
  // random() === 0 always swaps with index 0, rotating the array left by one.
  assert.deepEqual(shuffle([1, 2, 3, 4], () => 0), [2, 3, 4, 1]);
});

test('winningLines is empty when nothing is complete', () => {
  assert.deepEqual(winningLines(initialMarked()), []);
  assert.deepEqual(winningLines(markedWith([[0, 0], [0, 1], [0, 2], [0, 3]])), []);
});

test('winningLines returns the cells of a completed row, column or diagonal', () => {
  assert.deepEqual(winningLines(markedWith(range.map(j => [1, j]))), [range.map(j => [1, j])]);
  assert.deepEqual(winningLines(markedWith(range.map(i => [i, 3]))), [range.map(i => [i, 3])]);
  assert.deepEqual(winningLines(markedWith(range.map(k => [k, SIZE - 1 - k]))),
    [range.map(k => [k, SIZE - 1 - k])]);
});

test('winningLines reports every line when several are complete', () => {
  // The middle row and middle column cross at FREE.
  const lines = winningLines(markedWith([...range.map(j => [2, j]), ...range.map(i => [i, 2])]));
  assert.deepEqual(lines, [range.map(j => [2, j]), range.map(i => [i, 2])]);

  const all = initialMarked().map(row => row.map(() => true));
  assert.equal(winningLines(all).length, 2 * SIZE + 2);
});

test('checkBingo agrees with winningLines', () => {
  const cases = [initialMarked(), markedWith(range.map(k => [k, k])), markedWith([[0, 0], [4, 4]])];
  for (const marked of cases) assert.equal(checkBingo(marked), winningLines(marked).length > 0);
});

test('bingoMessage names the number of lines', () => {
  assert.equal(bingoMessage(0), '');
  assert.equal(bingoMessage(1), 'Bingo!');
  assert.equal(bingoMessage(2), 'Double Bingo!');
  assert.equal(bingoMessage(3), 'Triple Bingo!');
  assert.equal(bingoMessage(12), '12× Bingo!');
});
