# Native Build Report

日期：2026-06-05

## Android

已完成：

- `npm run assets:release`
- `npm run build`
- `npx cap sync android`
- `npm run google:aab`
- 直接 Gradle 释放包探测：`node scripts/run-android-gradle.mjs bundleRelease`

当前状态：

- 本机已安装 Homebrew `openjdk@21`，`scripts/run-android-gradle.mjs` 会优先使用独立 JDK 21，再回退到 Android Studio JBR。
- `scripts/run-android-gradle.mjs` 默认使用一次性 Gradle user home 和 `--no-daemon`，避免旧的 `/private/tmp/arrow-gradle-cache` 损坏后阻塞发布构建。
- `npm run google:aab` 已接入 `npm run verify:android:release`，Android 上架门禁不会被 Meta placeholder 阻断。
- `npm run google:aab` 已成功产出本地 Android App Bundle。
- `android/app/build.gradle` 已支持正式 upload key 环境变量；当前未提供 keystore 时产物是 release bundle 但不是 Google Play 可上传的正式签名包。

当前产物：

```text
android/app/build/outputs/bundle/release/app-release.aab
```

提交 Google Play 前仍需：

1. 提供正式 upload key 环境变量：

```bash
export ANDROID_RELEASE_STORE_FILE=/absolute/path/to/upload-key.jks
export ANDROID_RELEASE_STORE_PASSWORD=...
export ANDROID_RELEASE_KEY_ALIAS=...
export ANDROID_RELEASE_KEY_PASSWORD=...
```

2. 确认 Google Play Console 中的 application id、versionCode、versionName 与 `platform-manifest.json` 一致。
3. 重新运行：

```bash
npm run google:aab
```

4. 用 `jarsigner -verify -verbose -certs android/app/build/outputs/bundle/release/app-release.aab` 确认 signed AAB。

预期提审产物：

```text
android/app/build/outputs/bundle/release/app-release.aab
```

## iOS

已完成：

- `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer npm run ios:prepare`
- Web assets 已同步到 `ios/App/App/public`。
- CocoaPods 已成功 `pod install`。
- iOS 图标、开屏图、版本号、AdMob App ID 占位、Portrait orientation 已写入 native project。

当前阻塞：

- 本机默认 `xcode-select` 指向 Command Line Tools，需要用完整 Xcode。
- 使用 `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer` 后，`xcodebuild` 继续到 asset catalog 阶段，但失败于本机 Xcode/CoreSimulator 版本不一致：

```text
CoreSimulator is out of date.
No simulator runtime version ... available to use with iphonesimulator SDK ...
```

解除方式：

1. 更新 macOS / Xcode / iOS Simulator runtime，使 CoreSimulator 与当前 Xcode 匹配。
2. 或将全局 Xcode 指向完整 Xcode：

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

3. 在 Xcode 中配置 Apple Developer Team、签名证书、真实 Bundle ID 后 Archive。

可复跑的无签名构建探测：

```bash
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer \
xcodebuild -workspace ios/App/App.xcworkspace \
  -scheme App \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  CODE_SIGNING_ALLOWED=NO \
  build
```
