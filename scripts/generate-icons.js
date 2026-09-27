// Regenerates every icon the web app, desktop app, Microsoft Store and
// Capacitor need from public/icons/icon.svg. Run with `npm run icons` after
// changing the SVG; the generated files are committed so normal builds don't
// need sharp.
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const sharp = require('sharp');

const root = path.join(__dirname, '..');
const svg = fs.readFileSync(path.join(root, 'public/icons/icon.svg'));
const BRAND = '#1e2a44';

// Square icon scaled to `size`.
function icon(size, out) {
  return sharp(svg, { density: 384 }).resize(size, size).png().toFile(path.join(root, out));
}

// Icon centred on a solid brand-coloured canvas (for maskable icons and
// splash screens that must not have transparent padding).
async function padded(width, height, iconSize, out) {
  const art = await sharp(svg, { density: 384 }).resize(iconSize, iconSize).png().toBuffer();
  return sharp({ create: { width, height, channels: 4, background: BRAND } })
    .composite([{ input: art, gravity: 'center' }])
    .png()
    .toFile(path.join(root, out));
}

async function main() {
  // Web / PWA
  await icon(32, 'public/icons/favicon-32.png');
  await icon(180, 'public/icons/apple-touch-icon.png');
  await icon(192, 'public/icons/icon-192.png');
  await icon(512, 'public/icons/icon-512.png');
  await padded(512, 512, 360, 'public/icons/maskable-512.png');

  // Capacitor source assets (for `npx @capacitor/assets generate`)
  await icon(1024, 'resources/icon.png');
  await padded(2732, 2732, 800, 'resources/splash.png');

  // Desktop (Tauri) icons, including the Store tiles in src-tauri/icons/.
  // Mobile icons come from Capacitor instead, so drop Tauri's copies.
  execSync('npx tauri icon public/icons/icon.svg', { cwd: root, stdio: 'inherit' });
  for (const dir of ['android', 'ios']) {
    fs.rmSync(path.join(root, 'src-tauri/icons', dir), { recursive: true, force: true });
  }
  // Microsoft Store (MSIX) tiles used by tauri-windows-bundle
  const msixAssets = 'src-tauri/gen/windows/Assets';
  for (const name of ['StoreLogo.png', 'Square44x44Logo.png', 'Square150x150Logo.png']) {
    fs.copyFileSync(path.join(root, 'src-tauri/icons', name), path.join(root, msixAssets, name));
  }
  await padded(310, 150, 120, `${msixAssets}/Wide310x150Logo.png`);

  console.log('Icons generated.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
