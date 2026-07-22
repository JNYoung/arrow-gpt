# Google Play 报表自动化

Arrow Again 通过 Play Console 的私有 Google Cloud Storage 报表桶自动读取商店和质量数据，不要求每天打开 Play Console。

## 一次性设置

推荐复用本机已经登录、且有 Play Console 权限的 Google Cloud ADC 用户。这样不需要邀请新的服务账号。

1. Play Console → 下载报告，在任一非财务报表分区点击“复制 Cloud Storage URI”。URI 以 `gs://pubsite_prod_rev_` 开头。
2. 创建本机配置文件 `$HOME/.config/google-play/arrow-again-reports.json`：

```json
{
  "bucketUri": "gs://pubsite_prod_rev_REPLACE_ME"
}
```

配置文件位于项目外，不提交到 Git。

如果本机没有 ADC，运行 `gcloud auth application-default login`，并使用有 Play Console 全局批量报表读取权限的账号。只有在必须使用无人值守服务账号时，才在配置中增加 `credentialsPath`，并在 Play Console 邀请该服务账号，授予全局的“查看应用信息并下载批量报告”只读权限；不要授予发布、财务或管理员权限。

## 命令

检查一次性设置：

```bash
npm run play:reports -- --status --json
```

拉取本月和上月的报表：

```bash
npm run play:reports -- --lookback-months=2 --json
```

报表写入 `reports/play-console/`，包括可用的 Store Performance、installs、crashes、ratings 和 reviews 月度文件。下载文件会统一转成 UTF-8；同一 Cloud Storage generation 不会重复下载。

`latest-fetch.json` 记录数据新鲜度、下载文件和服务账号。Google Play 批量报表通常比源活动晚 3–7 天，因此监控不假设文件每天在固定时间更新。

## 安全边界

- 服务账号模式的 OAuth scope 仅为 `devstorage.read_only`；ADC 模式使用现有 Google Cloud 登录的只读下载能力。
- 原始报表是聚合数据，不包含用户级标识。
- 自动化不会修改商店页、发布版本或财务数据。
- Cloud Storage 批量报表要求全局查看应用信息权限；这是 Google Play 对批量下载的要求，而不是脚本扩大权限。

官方说明：[Download and export monthly reports](https://support.google.com/googleplay/android-developer/answer/6135870?hl=en)
