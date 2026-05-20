# Arrow Again / 箭了又箭

TypeScript + Canvas + SVG MVP for a cross-platform arrow puzzle game.

## Targets

- Web / H5: Vite build.
- Meta Instant Games: Vite build plus `fbapp-config.json` and a packaged zip.
- iOS / Android: Capacitor shell using the same web runtime.

## Local Development

```bash
npm install
npm run dev
```

## Verification

```bash
npm run typecheck
npm run verify:levels
npm run build
```

## Meta Instant Games Package

```bash
npm run meta:zip
```

The packaged files are generated under `releases/meta-instant-game/`.

## Native Projects

After dependencies are installed:

```bash
npm run cap:add:android
npm run cap:add:ios
npm run cap:sync
```

Android debug build on this machine:

```bash
npm run android:debug
```

Android release builds should be produced as an Android App Bundle in Android Studio.
iOS release builds require an Apple Developer account, signing team, bundle ID, icons,
screenshots, and App Store privacy metadata.

## Native Environment Notes

- Android requires JDK 21 or newer for Capacitor 7. On this machine, the verified build used
  `/opt/homebrew/opt/openjdk`.
- iOS requires a full Xcode installation selected by `xcode-select`. Command Line Tools alone
  are not enough for `pod install` or simulator/device builds.
- Store submission still needs production icons, screenshots, signing certificates, privacy
  policy URL, package identifiers, and developer account access.
