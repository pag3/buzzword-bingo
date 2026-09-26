// Writes your Microsoft Store identity (from Partner Center > Product
// management > Product identity) into the Tauri/MSIX config. Run it once after
// reserving the app name and commit the result, or let CI run it from
// repository variables. These values are public (they appear in the Store
// package), so they are safe to commit.
//
//   MS_STORE_IDENTITY_NAME=12345Name.BuzzwordBingo \
//   MS_STORE_PUBLISHER=CN=ABCDEF12-3456-7890-ABCD-EF1234567890 \
//   MS_STORE_PUBLISHER_DISPLAY_NAME="Paul A. Gusmorino 3rd" \
//   npm run store:identity
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const {
  MS_STORE_IDENTITY_NAME: identityName,
  MS_STORE_PUBLISHER: publisher,
  MS_STORE_PUBLISHER_DISPLAY_NAME: publisherDisplayName
} = process.env;

if (!identityName || !publisher || !publisherDisplayName) {
  console.error('Set MS_STORE_IDENTITY_NAME, MS_STORE_PUBLISHER and MS_STORE_PUBLISHER_DISPLAY_NAME.');
  process.exit(1);
}
if (!/^CN=/.test(publisher)) {
  console.error('MS_STORE_PUBLISHER must look like CN=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX.');
  process.exit(1);
}

function updateJson(file, update) {
  const full = path.join(root, file);
  const data = fs.existsSync(full) ? JSON.parse(fs.readFileSync(full, 'utf8')) : {};
  update(data);
  fs.writeFileSync(full, JSON.stringify(data, null, 2) + '\n');
  console.log(`Updated ${file}`);
}

// The MSIX tool uses the Tauri identifier as the package identity name.
// tauri.windows.conf.json only applies to Windows builds, so macOS/Linux keep
// com.pag3.buzzwordbingo.
updateJson('src-tauri/tauri.windows.conf.json', data => {
  data.identifier = identityName;
});

updateJson('src-tauri/gen/windows/bundle.config.json', data => {
  data.publisher = publisher;
  data.publisherDisplayName = publisherDisplayName;
});
