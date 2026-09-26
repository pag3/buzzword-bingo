// Produces a fully self-contained static build in dist/ (no server or network
// needed). dist/ is what the web server, Tauri and Capacitor all ship.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');

fs.rmSync(dist, { recursive: true, force: true });
fs.cpSync(path.join(root, 'public'), dist, { recursive: true });

const vendor = {
  'react/react.production.min.js': 'react/umd/react.production.min.js',
  'react-dom/react-dom.production.min.js': 'react-dom/umd/react-dom.production.min.js'
};
for (const [dest, src] of Object.entries(vendor)) {
  const target = path.join(dist, 'vendor', dest);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(root, 'node_modules', src), target);
}

console.log('Built static app into dist/');
