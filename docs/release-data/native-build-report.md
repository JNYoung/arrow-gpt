# Native Build Report

日期：2026-07-22

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
- `android/app/build.gradle` 已支持正式 upload key 环境变量；当前使用 `android/release-signing.env` 和 `android/upload-key.jks` 产出 Google Play 可上传的正式签名包。
- 2026-06-30 安卓真机 PKB110 验证通过：竖屏锁定生效，`♥ 被挡扣 1` 引导可见，点击被挡箭头后生命从 `3/3` 变为 `2/3`，原真机存档已恢复。
- 2026-06-30 已重新上传 Google Play alpha track：`1.0.3 (5)` / versionCode `5`，包含品牌标题单语言显示、反馈入口移入设置、默认语言跟随系统。
- 2026-07-22 已将 `compileSdkVersion` / `targetSdkVersion` 升至 API 36，并将 Android Gradle Plugin 升至 8.10.1。
- 2026-07-22 已上传 Google Play production track：`1.0.4 (6)`，API validate / commit / readback 均成功。

当前产物：

```text
android/app/build/outputs/bundle/release/app-release.aab
```

当前 AAB：

```text
Version name: 1.0.4
Version code: 6
Target SDK: 36
SHA-256: 76fd94a7a1b02453e76e76d3ce5ff9275967697e94cf63750bc2e450695f5c5c
Signing status: signed with the local Android upload key from android/release-signing.env.
Google Play track: production
Google Play release status: completed
```

重新打包 Google Play 前需：

1. 确认正式 upload key 环境变量已由 `android/release-signing.env` 或 shell 提供：

```bash
export ANDROID_RELEASE_STORE_FILE=/absolute/path/to/upload-key.jks
export ANDROID_RELEASE_STORE_PASSWORD=...
export ANDROID_RELEASE_KEY_ALIAS=...
export ANDROID_RELEASE_KEY_PASSWORD=...
```

2. 递增 `android/app/build.gradle` 和 `platform-manifest.json` 中的 Android versionCode/versionName。
3. 重新运行：

```bash
npm run google:aab
```

4. 用 `jarsigner -verify android/app/build/outputs/bundle/release/app-release.aab` 确认 signed AAB。

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
