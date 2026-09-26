const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { stampServiceWorker } = require('../scripts/build.js');

const SW_SOURCE = fs.readFileSync(path.join(__dirname, '..', 'public', 'sw.js'), 'utf8');

const tempDirs = [];
after(() => {
  for (const dir of tempDirs) fs.rmSync(dir, { recursive: true, force: true });
});

// A throwaway dist/ with the real sw.js and the given files.
function makeDist(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bingo-dist-'));
  tempDirs.push(dir);
  fs.writeFileSync(path.join(dir, 'sw.js'), SW_SOURCE);
  for (const [name, contents] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
    fs.writeFileSync(path.join(dir, name), contents);
  }
  return dir;
}

function readStamped(dir) {
  const sw = fs.readFileSync(path.join(dir, 'sw.js'), 'utf8');
  const version = JSON.parse(sw.match(/^const CACHE_VERSION = (.*);$/m)[1]);
  const assets = JSON.parse(sw.match(/^const ASSETS = (.*);$/m)[1]);
  return { version, assets };
}

test('lists every built file (including subfolders) except sw.js itself', () => {
  const dir = makeDist({ 'index.html': 'a', 'app.js': 'b', 'icons/icon.svg': 'c' });
  stampServiceWorker(dir);
  assert.deepEqual(readStamped(dir).assets, ['./', 'app.js', 'icons/icon.svg', 'index.html']);
});

test('the cache version is the same for identical builds', () => {
  const files = { 'index.html': 'a', 'app.js': 'b' };
  const a = makeDist(files);
  const b = makeDist(files);
  stampServiceWorker(a);
  stampServiceWorker(b);
  assert.equal(readStamped(a).version, readStamped(b).version);
  assert.match(readStamped(a).version, /^buzzword-bingo-[0-9a-f]{12}$/);
});

test('changing any file changes the cache version', () => {
  const a = makeDist({ 'index.html': 'a', 'app.js': 'b' });
  const b = makeDist({ 'index.html': 'a', 'app.js': 'changed' });
  stampServiceWorker(a);
  stampServiceWorker(b);
  assert.notEqual(readStamped(a).version, readStamped(b).version);
});

test('adding or renaming a file changes the cache version', () => {
  const a = makeDist({ 'app.js': 'b' });
  const b = makeDist({ 'app.js': 'b', 'extra.css': '' });
  const c = makeDist({ 'renamed.js': 'b' });
  for (const dir of [a, b, c]) stampServiceWorker(dir);
  const versions = new Set([a, b, c].map(dir => readStamped(dir).version));
  assert.equal(versions.size, 3);
});

test('the stamped service worker is still valid JavaScript', () => {
  const dir = makeDist({ 'index.html': 'a' });
  stampServiceWorker(dir);
  assert.doesNotThrow(() => new Function(fs.readFileSync(path.join(dir, 'sw.js'), 'utf8')));
});

test('fails loudly if sw.js no longer has the constants to fill in', () => {
  const dir = makeDist({ 'index.html': 'a' });
  fs.writeFileSync(path.join(dir, 'sw.js'), '// nothing to stamp\n');
  assert.throws(() => stampServiceWorker(dir), /could not find/);
});

test('stamping an already-stamped service worker updates it in place', () => {
  const dir = makeDist({ 'app.js': 'b' });
  stampServiceWorker(dir);
  const first = readStamped(dir).version;
  fs.writeFileSync(path.join(dir, 'app.js'), 'changed');
  stampServiceWorker(dir);
  assert.notEqual(readStamped(dir).version, first);
  assert.deepEqual(readStamped(dir).assets, ['./', 'app.js']);
});
