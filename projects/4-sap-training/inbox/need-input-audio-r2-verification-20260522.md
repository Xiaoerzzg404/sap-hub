# 已确认 · 课程音频 R2 上传与公网播放核验 · 2026-05-22

- updated_by: codex
- updated_at: 2026-05-22T10:38:40+09:00
- status: answered_by_ryan_platform_config_pending

## 当前发现

当前分支已经包含 commit `5654676 codex: sync course audio（R2 CDN 发布准备）`，其中 `web/ops/site-ledger/reports/2026-05-21T23-51-09-509Z__r2-course-audio-upload.json` 显示：

- `dryRun=false`
- `uploaded=1543`
- `failed=0`
- `prefix=course-audio/20260521`
- `publicBaseConfigured=false`

这说明仓库证据显示 1543 个课程 TTS mp3 已上传到 R2 前缀，但公网 base URL / CDN env 仍未配置或未记录。

## Ryan 本轮确认

Ryan 已在 2026-05-22 本轮明确确认：

- R2 上传是 Ryan 授权执行的，已上传的 `course-audio/20260521/` 可以保留。
- 不删除、不重新上传课程音频。
- 不允许把 1543 个 mp3 force-add 到 Git。
- 不允许改用 Vercel artifact deploy。
- 允许 Cloudflare R2 / CDN 对 `course-audio/20260521/` 课程 TTS 音频做公开读取。
- 公开读取仅限课程 TTS 音频前缀，不允许公开 student recordings、teacher recordings、feedback、用户上传录音或任何个人数据。
- 允许在 Vercel Preview 和 Production 配置 `NEXT_PUBLIC_COURSE_AUDIO_BASE_URL`，指向公开 CDN base URL。
- 允许本地和公网各抽查 phrase、shadowing、term 三类音频路径。

## 本轮执行结果

- R2 上传证据仍为：1543/1543 uploaded，failed 0，前缀 `course-audio/20260521/`。
- 本地未发现可用的 Vercel CLI / Wrangler CLI / `.vercel` 项目绑定，也未发现 `NEXT_PUBLIC_COURSE_AUDIO_BASE_URL` 已配置在 `.env.local`。
- 因缺少可用平台配置权限，本轮未在 Cloudflare 或 Vercel 控制台修改任何配置。
- 本地 authenticated 音频抽查通过：
  - phrase：`/audio/phrase/lesson_01-phrase-001.mp3`，HTTP 206，`audio/mpeg`，可加载字节。
  - shadowing：`/audio/shadowing/lesson_01-shadow-01.mp3`，HTTP 206，`audio/mpeg`，可加载字节。
  - term：`/audio/term/lesson_01-term-001.mp3`，HTTP 206，`audio/mpeg`，可加载字节。
- Preview 已重新部署到 commit `cbb7ed25024de899553d38c63ddb8635a4f8d6c5`，Vercel 状态为 success，`/login` 为 200。
- Preview 因未配置 CDN base URL 且 mp3 不进 Git，authenticated `/audio/phrase/lesson_01-phrase-001.mp3` 返回 404；这不是通过项，是生产阻塞项。
- 公网 CDN 三类音频抽查尚未完成，因为当前缺少公开 CDN base URL。

## Ryan 控制台待办

1. Cloudflare：仅将 `course-audio/20260521/` 课程 TTS 前缀暴露到公开 CDN 或自定义域名。
2. Cloudflare：确认不公开 student recordings、teacher recordings、feedback、用户上传录音或任何个人数据前缀。
3. Vercel Preview：配置 `NEXT_PUBLIC_COURSE_AUDIO_BASE_URL` 为公开 CDN base URL，并重新部署当前 PR Preview。
4. Vercel Production：配置同名 public env，生产合并前再次确认。
5. 配置完成后，重新抽查 phrase、shadowing、term 三个公网 CDN URL 的 HTTP 状态、content-type、浏览器加载情况。

## 当前停手规则

仍然停手：不删除 R2 对象、不重新上传、不改用 artifact deploy、不 force-add mp3、不 merge、不生产 deploy。下一步只等 Ryan 完成或授权可执行的 Cloudflare/Vercel 平台配置。
