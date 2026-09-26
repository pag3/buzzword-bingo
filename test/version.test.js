const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

// The app version lives in several places (see "Keeping versions in sync" in
// docs/PUBLISHING.md). package.json is the source of truth; the rest must match.
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const version = JSON.parse(read('package.json')).version;

test('package.json has a MAJOR.MINOR.PATCH version', () => {
  assert.match(version, /^\d+\.\d+\.\d+$/);
});

test('package-lock.json matches package.json', () => {
  const lock = JSON.parse(read('package-lock.json'));
  assert.equal(lock.version, version);
  assert.equal(lock.packages[''].version, version);
});

test('the Tauri app takes its version from package.json', () => {
  assert.equal(JSON.parse(read('src-tauri/tauri.conf.json')).version, '../package.json');
});

test('src-tauri/Cargo.toml and Cargo.lock match package.json', () => {
  assert.equal(read('src-tauri/Cargo.toml').match(/^version = "(.*)"$/m)[1], version);
  assert.equal(
    read('src-tauri/Cargo.lock').match(/name = "buzzword-bingo"\nversion = "(.*)"/)[1], version);
});

test('Android versionName matches package.json', () => {
  assert.equal(read('android/app/build.gradle').match(/versionName "(.*)"/)[1], version);
});

test('iOS MARKETING_VERSION matches package.json in every build configuration', () => {
  const versions = [...read('ios/App/App.xcodeproj/project.pbxproj')
    .matchAll(/MARKETING_VERSION = (.*);/g)].map(m => m[1]);
  assert.ok(versions.length > 0);
  for (const v of versions) assert.equal(v, version);
});

test('Android versionCode and iOS build number agree', () => {
  // Both count releases, so they go up together.
  const code = read('android/app/build.gradle').match(/versionCode (\d+)/)[1];
  const builds = [...read('ios/App/App.xcodeproj/project.pbxproj')
    .matchAll(/CURRENT_PROJECT_VERSION = (\d+);/g)].map(m => m[1]);
  assert.ok(builds.length > 0);
  for (const b of builds) assert.equal(b, code);
});
