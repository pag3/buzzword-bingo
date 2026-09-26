const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  {
    ignores: ['dist/', 'android/', 'ios/', 'src-tauri/']
  },
  js.configs.recommended,
  {
    // Node: build scripts, the dev server, tests and this config.
    files: ['*.js', 'scripts/**/*.js', 'test/**/*.js'],
    languageOptions: { sourceType: 'commonjs', globals: globals.node }
  },
  {
    // Browser scripts, loaded with plain <script> tags (no bundler).
    files: ['public/**/*.js'],
    languageOptions: {
      sourceType: 'script',
      globals: { ...globals.browser, React: 'readonly', ReactDOM: 'readonly', BingoLogic: 'readonly' }
    }
  },
  {
    // game.js is also require()d by the tests.
    files: ['public/game.js'],
    languageOptions: { globals: { module: 'readonly' } }
  },
  {
    files: ['public/sw.js'],
    languageOptions: { globals: globals.serviceworker }
  }
];
