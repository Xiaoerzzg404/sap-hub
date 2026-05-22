# 人工检查清单 · sap-jp.training 公网同步 · 2026-05-22

- updated_by: codex
- updated_at: 2026-05-22T09:05:00+09:00
- scope: Ryan 人工登录控制台检查项；Codex 本轮只做只读本地/connector 查询，不修改这些平台配置。

## Vercel

- 检查项：PR Preview deployment 是否为 Ready；Production 是否绑定 `sap-jp.training`；Preview/Production env 是否包含 `DATABASE_URL`、`AUTH_SECRET`、`NEXTAUTH_URL`、`CRON_SECRET`、`REGISTRATION_INVITE_CODE`、`NEXT_PUBLIC_COURSE_AUDIO_BASE_URL`、R2、Sentry、Upstash、Resend 相关 key。
- 期望状态：Preview Ready；Production env 与 Preview/Production 策略一致；`NEXT_PUBLIC_COURSE_AUDIO_BASE_URL` 指向公开 CDN base URL，不含 signed URL。
- 异常处理：缺 env 时先补 env 并重新触发 Preview；不要先 merge 到 main。

## Cloudflare R2 / CDN

- 检查项：R2 bucket 中 `course-audio/20260521/` 前缀存在 1543 个 mp3；公开 CDN 域名能访问 `course-audio/20260521/phrase/lesson_01-phrase-001.mp3`；学员录音 lifecycle 仍只作用于 `audio/` 前缀。
- 期望状态：课程音频可公开读；录音 bucket 私有策略不被放宽；课程音频和学员录音前缀隔离。
- 异常处理：若 CDN 未配置，先配置公开域名/缓存策略，再设置 Vercel `NEXT_PUBLIC_COURSE_AUDIO_BASE_URL`。

## Neon / DB

- 检查项：目标 DB schema 已有 `user_roles`，`users.username`、`users.password_hash`、`users.password_updated_at`，以及唯一约束；确认没有 DB reset/truncate 操作记录。
- 期望状态：migration `0003_auth_credentials_multi_role.sql` 已应用；三条 smoke 测试账号存在且角色正确。
- 异常处理：若发现 partial schema，停止 deploy，先备份并手动审查 migration 差异。

## Auth / Security

- 检查项：生产注册是否需要邀请码；owner 初始化是否需要 `OWNER_BOOTSTRAP_TOKEN`；历史无密码账号认领是否需要 `ACCOUNT_CLAIM_TOKEN`。
- 期望状态：生产不开放无门槛注册；token 只在 Vercel env / 本地安全位置存在；使用后轮换或删除一次性 token。
- 异常处理：若生产缺 `REGISTRATION_INVITE_CODE`，注册 API 会 fail-closed，先补 env 后再开放 beta 注册。

## Sentry

- 检查项：项目 DSN、Preview/Production event、release/deployment tag 是否出现；是否有新 error。
- 期望状态：`NEXT_PUBLIC_SENTRY_DSN` 配置存在；Preview 访问不产生新 P0/P1 error。
- 异常处理：有新错误时先修分支并重新 Preview，不 merge。

## Upstash

- 检查项：Redis REST URL/token env 存在；login/upload/feedback rate limit key 有低量 smoke 记录；无异常爆量。
- 期望状态：Preview/Production 能连接，rate limit 不影响正常 smoke 登录。
- 异常处理：若连接失败或 429 异常，先修 env 或 matcher，不开放公网 beta。

## Resend

- 检查项：`RESEND_API_KEY`、`AUTH_EMAIL_FROM` 是否存在；最近发送日志无真实业务误发。
- 期望状态：本轮不发送真实邮件；生产发信域名和 sender 已验证。
- 异常处理：若域名未验证，不开启 magic-link 邮件；只保留 credentials smoke。

## Google Search Console / Safe Browsing

- 检查项：`sap-jp.training` property 状态、索引覆盖、Security Issues / Safe Browsing 申诉状态。
- 期望状态：无安全警告；若仍有旧警告，记录截图和 next review date。
- 异常处理：先按 Google 指引修复/申诉，不推进公开营销入口。

## GitHub

- 检查项：PR checks、branch protection、merge method、是否 draft。
- 期望状态：PR 保持 draft，CI 和 Vercel Preview 成功；未自动合并。
- 异常处理：若 GitHub Actions 或 Preview 失败，先修分支，不强行 merge。
