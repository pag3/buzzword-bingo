# Publishing Buzzword Bingo to app stores

This is the maintainer guide for releasing Buzzword Bingo to app stores. Every store build bundles the complete game, so it works fully offline from the first launch and needs **no web hosting**. The stores host and deliver the downloads.

## Why these tools

| Option | Offline on first launch? | Needs your own hosting? | Used? |
| --- | --- | --- | --- |
| **Tauri → MSIX** via [tauri-windows-bundle](https://github.com/Choochmeque/tauri-windows-bundle) (Microsoft Store) | Yes, files are embedded in the app | No, Microsoft hosts and signs the package | **Yes: Windows, macOS, Linux** |
| **Capacitor → Android / iOS** | Yes, files ship inside the app | No | **Yes: Google Play and the App Store** |
| Tauri → official `.exe`/`.msi` Store route | Yes | You host the installer and buy a code-signing certificate | No |
| Electron → appx | Yes | No | No; ~100 MB download and ~280 MB installed vs. ~3–10 MB for Tauri |
| PWABuilder → MSIX / TWA | No, it loads your website at runtime | Yes, the app is a shell around a URL | No |

Tauri doesn't bundle a browser. On Windows it uses WebView2, which is built into Windows 11. MSIX packages can't install WebView2 themselves, so the Store package requires **Windows 11** (`--min-windows 10.0.22000.0` in the `dist:store` script in `package.json`). The Store hides the app from Windows 10 PCs, which reached end of support in October 2025.

`tauri-windows-bundle` is a community tool, not part of Tauri itself. If it ever stops working with a new Tauri release, the fallback is Tauri's official `.exe`/`.msi` Store route, which needs a code-signing certificate. The game itself doesn't depend on either tool.

## What every store asks for

- **Privacy policy URL.** The app collects nothing; the policy text is in [`PRIVACY.md`](../PRIVACY.md) and `public/privacy.html`. Free URLs you can use:
  - `https://github.com/pag3/buzzword-bingo/blob/main/PRIVACY.md`, or
  - `https://pag3.github.io/buzzword-bingo/privacy.html` after enabling the optional **Deploy web version to GitHub Pages** workflow (Settings → Pages → Source: *GitHub Actions*).
- **Screenshots.** Run the app (`npm run desktop`, or the Android emulator) and capture a few boards. Microsoft wants at least one desktop screenshot of 1366×768 or larger. Google wants phone screenshots. Apple wants 6.9" and 13" iPad sizes.
- **Age rating questionnaire.** No violence, no user interaction, no data collection. This should come out as *Everyone / 3+*.
- **Description.** Suggested short description: *"Mark off corporate buzzwords as you hear them in meetings. Complete a row, column, or diagonal to win. Works offline, no ads, no tracking."*
- **Icons.** Already generated from `public/icons/icon.svg` (`npm run icons`). A 1024×1024 PNG for listings is at `src-tauri/icons/icon.png`.

## Microsoft Store (Windows)

1. **Create a developer account** at <https://storedeveloper.microsoft.com> (identity verification required).
2. **Reserve the app name** in [Partner Center](https://partner.microsoft.com/dashboard): *Apps and games → New product → MSIX or PWA app → "Buzzword Bingo"*.
3. **Copy the product identity** from *Product management → Product identity* into GitHub (*Settings → Secrets and variables → Actions → Variables*):

   | Variable | Partner Center field | Example |
   | --- | --- | --- |
   | `MS_STORE_IDENTITY_NAME` | Package/Identity/Name | `12345PaulGusmorino.BuzzwordBingo` |
   | `MS_STORE_PUBLISHER` | Package/Identity/Publisher | `CN=ABCDEF12-3456-…` |
   | `MS_STORE_PUBLISHER_DISPLAY_NAME` | Package/Properties/PublisherDisplayName | `Paul A. Gusmorino 3rd` |

   The CI workflow applies them with `npm run store:identity`. These values are public, so instead you can run that script once locally with the same environment variables and commit the result. It writes `src-tauri/tauri.windows.conf.json` and `src-tauri/gen/windows/bundle.config.json`.
4. **Build the package.** Run the **Package apps** workflow (Actions tab → *Package apps* → *Run workflow*) and download `buzzword-bingo-microsoft-store`. It contains a `.msixbundle` with x64 and arm64 builds. On a Windows PC with Rust installed, `npm run dist:store` does the same; output goes to `src-tauri/target/msix/`.
   The package is unsigned on purpose, because the Store signs it during certification. To try the app locally, use `npm run desktop` instead of sideloading the package.
5. **Create a submission.** Upload the `.msixbundle` under *Packages*, fill in *Store listings*, *Properties* (category: Games → Puzzle & trivia, or Entertainment), *Age ratings* and *Pricing* (Free). Then submit. Certification usually takes 1–3 business days.
   In the submission's certification notes, you can mention that the app requests the `runFullTrust` capability because it's a desktop app; that is standard for Tauri and Electron apps.
6. **Updates.** Bump `"version"` in `package.json` (Tauri reads it from there). The package version must increase for every submission. Then rebuild and upload.

## Google Play (Android)

1. Install [Android Studio](https://developer.android.com/studio).
2. Run `npm install` and then `npm run cap:android`. This builds the web app, copies it into `android/`, and opens Android Studio.
3. In Android Studio, choose *Build → Generate Signed App Bundle / APK → Android App Bundle* and create an **upload keystore**. Back this file and its passwords up somewhere safe. You need them for every future update.
4. Create the app in the [Play Console](https://play.google.com/console), complete the *App content* section (privacy policy URL, data safety: "no data collected", ads: none, target audience), and upload the `.aab`.
   New personal developer accounts must run a closed test with at least 12 testers for 14 days before production access.
5. **Updates.** Increase `versionCode` and `versionName` in `android/app/build.gradle`, run `npm run cap:sync`, then build a new bundle.

The *Package apps* workflow also produces an unsigned debug APK you can install on a phone for testing.

## Apple App Store (iOS / iPadOS)

1. On a Mac, install Xcode and join the [Apple Developer Program](https://developer.apple.com/programs/).
2. Run `npm install` and then `npm run cap:ios`. This opens `ios/App` in Xcode.
3. Under *Signing & Capabilities*, pick your team. The bundle ID is `com.pag3.buzzwordbingo`.
4. Create the app in [App Store Connect](https://appstoreconnect.apple.com), then use *Product → Archive → Distribute App* in Xcode to upload.
5. In App Store Connect, set *App Privacy* to "Data Not Collected", add screenshots and the privacy policy URL, and submit for review.
6. **Updates.** Bump *Version* and *Build* in Xcode, run `npm run cap:sync`, then archive again.

## Other desktop platforms (optional)

- **macOS:** `npm run dist:desktop` on a Mac (or the CI workflow) produces a `.dmg` of a few MB. The build is ad-hoc signed (`bundle.macOS.signingIdentity: "-"` in `src-tauri/tauri.conf.json`), so on first launch macOS says it can't verify the developer; open it via **System Settings → Privacy & Security → Open Anyway**. Removing that warning needs Developer ID signing and notarisation, which need the Apple Developer Program. Publishing to the Mac App Store is possible with Tauri but needs extra Apple certificates and provisioning profiles.
- **Linux:** the `.AppImage` runs as-is and the `.deb` installs on Debian and Ubuntu. Tauri can also produce `.rpm`; Snap and Flatpak need separate packaging files.

## Keeping versions in sync

`package.json` holds the app version. Bump every one of these for a release:

- `package.json` → `version` (desktop and Microsoft Store, via `src-tauri/tauri.conf.json`). Use `npm version X.Y.Z --no-git-tag-version`, which also updates `package-lock.json`.
- `src-tauri/Cargo.toml` → `version`, and the `buzzword-bingo` entry in `src-tauri/Cargo.lock`
- `android/app/build.gradle` → `versionCode` (integer, +1 each release) and `versionName`
- the Xcode project → *Version* (`MARKETING_VERSION`) and *Build* (`CURRENT_PROJECT_VERSION`, kept equal to the Android `versionCode`)

`npm test` checks that all of these agree (`test/version.test.js`), so CI fails if one is missed.

## Releasing

1. Bump the versions as above in a pull request, and merge it.
2. Tag the merge commit on `main` with `v` plus the version (for example `v1.1.0`) and push the tag. The **Package apps** workflow starts automatically, and its first step fails fast if the tag doesn't match `package.json`.
3. When the run finishes, download each platform's package from the run's **Artifacts** section and submit them as described above.
