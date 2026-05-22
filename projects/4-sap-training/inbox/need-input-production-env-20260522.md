# Need Input · 生产部署前剩余确认 · 2026-05-22

- updated_by: codex
- updated_at: 2026-05-22T09:05:00+09:00
- status: waiting_for_ryan_before_production_merge

## 当前状态

本轮已完成 draft PR、Vercel Preview、R2 上传、Neon 0003 migration、smoke 测试账号和 authenticated smoke。尚未 merge main，尚未触发生产部署，`https://sap-jp.training` 仍视为未由本轮更新。

## 需要 Ryan 处理或确认

1. 在 Vercel Preview/Production env 配置 `NEXT_PUBLIC_COURSE_AUDIO_BASE_URL`，指向公开 CDN base URL，例如 CDN 域名下的 `course-audio/20260521`。
2. 在 Vercel Production env 配置 `REGISTRATION_INVITE_CODE`；否则生产注册会 fail-closed。
3. 如需 owner 初始化或历史账号认领，临时配置 `OWNER_BOOTSTRAP_TOKEN` / `ACCOUNT_CLAIM_TOKEN`，用后轮换或删除。
4. 完成 `manual-platform-checklist-20260522.md` 中 Sentry、Upstash、Resend、Google Search Console / Safe Browsing 的人工检查。
5. 确认是否在以上阻塞消除后 merge PR 到 main 触发 Vercel Production。

## 仍然停手

- 不 merge PR，不生产部署。
- 不 force-add mp3，不执行 Vercel artifact deploy。
- 不 DB reset / truncate / 覆盖真实 seed。
- 不发送真实业务邮件，不接管真实账号，不读取 magic-link token。
- 不使用任何未列明的新部署平台或新数据库。
