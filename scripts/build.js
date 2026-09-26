// Produces a fully self-contained static build in dist/ (no server or network
// needed). dist/ is what the web server, Tauri and Capacitor all ship.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');

// Every file under dir, as sorted forward-slash paths relative to dir.
function listFiles(dir, prefix = '') {
  return fs.readdirSync(dir, { withFileTypes: true })
    .flatMap(entry => {
      const rel = prefix + entry.name;
      return entry.isDirectory()
        ? listFiles(path.join(dir, entry.name), rel + '/')
        : [rel];
    })
    .sort();
}

// Fills in the service worker's asset list and cache version from the files
// actually in outDir. The version is a hash of every cached file's path and
// contents, so it changes whenever anything the app ships changes.
function stampServiceWorker(outDir) {
  const swPath = path.join(outDir, 'sw.js');
  const assets = listFiles(outDir).filter(file => file !== 'sw.js');

  const hash = crypto.createHash('sha256');
  for (const file of assets) {
    hash.update(file + '\0');
    hash.update(fs.readFileSync(path.join(outDir, file)));
  }
  const version = 'buzzword-bingo-' + hash.digest('hex').slice(0, 12);

  const replacements = [
    [/^const CACHE_VERSION = .*;$/m, `const CACHE_VERSION = ${JSON.stringify(version)};`],
    [/^const ASSETS = .*;$/m, `const ASSETS = ${JSON.stringify(['./', ...assets])};`]
  ];
  let sw = fs.readFileSync(swPath, 'utf8');
  for (const [pattern, value] of replacements) {
    if (!pattern.test(sw)) throw new Error(`sw.js: could not find ${pattern}`);
    sw = sw.replace(pattern, value);
  }
  fs.writeFileSync(swPath, sw);
  return { version, assets };
}

function build() {
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

  const { version, assets } = stampServiceWorker(dist);
  console.log(`Built static app into dist/ (${assets.length} files, cache ${version})`);
}

if (require.main === module) build();

module.exports = { listFiles, stampServiceWorker };
