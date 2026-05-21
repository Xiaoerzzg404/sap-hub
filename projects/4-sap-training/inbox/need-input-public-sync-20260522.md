# Need Input · sap-jp.training 公网同步确认 · 2026-05-22

- updated_by: codex
- updated_at: 2026-05-22T08:20:13+09:00
- status: waiting_for_user

## 需要 Ryan 确认

1. GitHub：是否允许把 `codex/sap-jp-content-audit-20260521` push 到 GitHub，并创建 PR？如果只允许本地 commit，请明确停在本地。
2. Vercel：是否允许部署到生产 `sap-jp.training`？当前本机没有 `vercel` CLI / `.vercel` project link / Vercel API env，若要部署请提供平台方式或授权使用 GitHub 部署。
3. 音频策略三选一：
   - A. force-add `1543` 个 mp3 到 Git。
   - B. 上传 mp3 到 Cloudflare R2/CDN，并改 manifest/base path。
   - C. 使用 Vercel CLI artifact deploy 包含本地 mp3。
4. Neon / DB：是否允许对目标数据库执行 `web/lib/db/migrations/0003_auth_credentials_multi_role.sql`？不会执行 DB reset，不碰真实学员数据。
5. 测试账号：请提供或确认可创建的测试 student、teacher、admin 账号/session，用于 authenticated `/me`、课程音频播放、`/review`、`/teacher`、`/admin` smoke。
6. 控制台人工检查：请确认 Sentry、Upstash、Resend、Google Search Console / Safe Browsing 是否由 Ryan 人工登录检查，或提供只读 API/token 方式。

## 停手规则

在 Ryan 明确确认前，不执行 push、PR、deploy、R2 上传、mp3 force-add、Vercel artifact deploy、Neon 生产 migration/seed、权限变更、真实邮件发送、真实账号接管、magic-link token 读取或任何生产数据修改。
