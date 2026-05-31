# Native Build Report

日期：2026-05-31

## Android

已完成：

- `npm run assets:release`
- `npm run build`
- `npx cap sync android`
- 直接 Gradle 释放包探测：`./gradlew bundleRelease`

当前阻塞：

- 本机只有 JDK 17。
- 当前 Capacitor Android 编译链路要求 Java source release 21，Gradle 报错：`错误: 无效的源发行版：21`。
- `npm run google:aab` 也会被 `scripts/run-android-gradle.mjs` 提前拦截，提示安装 JDK 21。
- 已尝试临时下载 / Homebrew 安装 JDK 21，但当前网络下载速度过慢，已中断，避免长时间阻塞。

解除方式：

1. 安装 Temurin 21 或 Homebrew `openjdk@21`。
2. 确认 `JAVA_HOME` 指向 JDK 21。
3. 重新运行：

```bash
npm run google:aab
```

预期产物：

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
