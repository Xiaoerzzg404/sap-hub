# 需确认 · 课程音频 R2 上传与公网播放核验 · 2026-05-22

- updated_by: codex
- updated_at: 2026-05-22T09:08:00+09:00
- status: answered_for_current_branch

## 当前发现

当前分支已经包含 commit `5654676 codex: sync course audio（R2 CDN 发布准备）`，其中 `web/ops/site-ledger/reports/2026-05-21T23-51-09-509Z__r2-course-audio-upload.json` 显示：

- `dryRun=false`
- `uploaded=1543`
- `failed=0`
- `prefix=course-audio/20260521`
- `publicBaseConfigured=false`

这说明仓库证据显示 1543 个课程 TTS mp3 已上传到 R2 前缀，但公网 base URL / CDN env 仍未配置或未记录。

## 需要 Ryan 确认

本轮 Ryan 已确认采用 R2/CDN 音频策略，并允许在当前环境有 R2 env 时执行上传。Codex 已执行上传与本地/Preview 只读核验：

- R2 上传：1543/1543，failed 0。
- 上传前缀：`course-audio/20260521/`。
- 未 force-add mp3。
- 未使用 Vercel artifact deploy。
- Preview 未登录访问 `/audio/...` 返回 307 到登录页，说明受保护路径仍由 middleware 控制。

下面的问题中，第 1、4、5 项本轮已处理；第 2、3 项仍需 Ryan 在 Cloudflare/Vercel 控制台确认并配置：

1. 这次 R2 上传是否是 Ryan 授权执行的？如果不是，请确认是否需要保留、覆盖、删除或重新上传。
2. Cloudflare R2 / CDN 上 `course-audio/20260521/` 是否可公开读取？
3. Vercel Production/Preview 是否允许配置 `NEXT_PUBLIC_COURSE_AUDIO_BASE_URL` 指向公开 CDN base URL？
4. 是否允许本地和公网各抽查 3 个路径：phrase、shadowing、term。
5. 是否需要更新 `need-input-public-sync-20260522.md`，把音频策略从三选一改为“R2/CDN 已选，等待 CDN/env/播放验证”？

## 停手规则

仍然停手：不删除 R2 对象、不重新上传、不改生产 env、不 merge、不生产 deploy。下一步只等 Ryan 配置/确认公开 CDN base URL，并在 Vercel 设置 `NEXT_PUBLIC_COURSE_AUDIO_BASE_URL`。
