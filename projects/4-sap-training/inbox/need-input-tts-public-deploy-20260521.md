# 需确认 · TTS 音频公开部署 · 2026-05-21

- updated_by: codex
- updated_at: 2026-05-22T08:04:26+09:00
- status: waiting_for_user

## 阻塞范围

将已生成的日语音频资产发布到公开 `sap-jp.training` 站点。

## 当前本地结果

- 已生成本地音频文件：`1543`。
- 本地音频大小：约 `65M`。
- 本地 manifest：`projects/4-sap-training/web/public/audio/audio-manifest.json`。
- 本地网站可用 `Content-Type: audio/mpeg` 返回 sample audio paths。

## 为什么需要确认

公开部署是外部发布动作。Project 4 护栏要求在 deploy/push/public release 前先写 inbox 提案并获得用户确认。

另外，生成的 `.mp3` 文件目前被 `.gitignore` 的 `**/*.mp3` 忽略，所以普通 Git-based Vercel deployment 不会包含这些文件。

## 请选择部署策略

1. 为本次课程 release force-add 生成的 mp3 文件到 Git。
   - Pro：最简单的 Vercel Git deployment。
   - Con：会向仓库加入约 65M 生成二进制资产。

2. 上传生成的 mp3 文件到 object storage/CDN，并重写音频路径。
   - Pro：更适合长期媒体架构。
   - Con：需要确定 storage bucket/domain，并做少量 path/config change。

3. 使用 Vercel CLI local deploy，包含当前生成资产。
   - Pro：可发布当前本地 artifact，不必 force-add mp3 文件。
   - Con：需要确认这是期望的 production deployment path，且可复现性可能不如 Git-based deploy。

## 可选音质升级

当前本地生成使用 macOS `Kyoko`，因为 `web/.env.local` 中没有 Azure/OpenAI TTS 凭据。如果希望公开发布前使用更自然的 neural Japanese voice，请提供或配置：

- `AZURE_SPEECH_KEY`、`AZURE_SPEECH_REGION`，以及可选 `AZURE_TTS_VOICE=ja-JP-NanamiNeural`。
- `OPENAI_API_KEY` 和已批准的 OpenAI TTS model/voice。
- human-recorded source audio，如果你想要真人旁白质量，而不是 TTS。

## 停手规则

在 Ryan 确认部署策略前，不执行 push、deploy、public upload 或 production path rewrite。
