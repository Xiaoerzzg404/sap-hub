# 已确认 · 注册与账号认领加固 · 2026-05-22

- updated_by: codex
- updated_at: 2026-05-22T10:38:40+09:00
- status: answered_by_ryan_env_config_pending

## 为什么需要确认

审查 `handoff-auth-credentials-roles-20260522.md` 时发现：公开注册不能直接负责 owner 初始化，也不能让历史无密码账号通过知道邮箱就设置密码。代码已改为 fail-closed，但生产上线前需要 Ryan 决定并配置对应环境变量。

## Ryan 本轮确认

Ryan 已在 2026-05-22 本轮明确确认：

- 生产环境必须启用 `REGISTRATION_INVITE_CODE`，邀请码只发给 beta 学员，由 Ryan 人工管理发放。
- 若当前环境有可用 Vercel CLI/API/GitHub 部署权限，允许 Codex 生成强随机邀请码并配置到 Vercel Preview/Production env，但不得打印或写入 Git/Markdown/日志。
- 允许使用 `OWNER_BOOTSTRAP_TOKEN` 做一次性 owner 初始化；完成后必须删除或轮换。
- `ACCOUNT_CLAIM_TOKEN` 只允许在确有历史 magic-link / 无密码账号需要设置密码时短期配置，只发给对应本人。
- 允许创建或更新 3 个 smoke test 专用账号：
  - student：`sapjp+student-smoke-20260522@example.com`
  - teacher：`sapjp+teacher-smoke-20260522@example.com`
  - admin：`sapjp+admin-smoke-20260522@example.com`

## 本轮执行结果

- 本地未发现可用 Vercel CLI / `.vercel` 项目绑定，也未发现 `VERCEL_API_TOKEN`、`VERCEL_PROJECT_ID`、`VERCEL_TEAM_ID` 当前可用；因此未生成、未配置、未打印 `REGISTRATION_INVITE_CODE`。
- `.env.local` 当前未配置 `REGISTRATION_INVITE_CODE`、`OWNER_BOOTSTRAP_TOKEN`、`ACCOUNT_CLAIM_TOKEN`、`NEXT_PUBLIC_COURSE_AUDIO_BASE_URL`。
- Preview 注册接口在无邀请码请求下返回 503 `registration_closed`，说明注册已 fail-closed；这比开放注册安全，但还不是 beta 可用状态。
- `OWNER_BOOTSTRAP_TOKEN` 本轮未使用、未配置、未删除或轮换，因为无法确认 owner 初始化已完成。
- 数据库中存在 5 个 `password_hash is null` 的账号记录。Codex 未读取 magic-link token、session cookie 或可登录凭据；`ACCOUNT_CLAIM_TOKEN` 本轮未配置。若 Ryan 要让这些历史账号本人设置密码，需要短期配置并在完成后删除或轮换。
- 已定向创建/更新 3 个 smoke test 专用账号，并写入强随机密码；密码只在当前进程中用于 smoke test，未打印、未写入文档、未写入 Git。
- Preview authenticated smoke 已通过：
  - student 登录后 `/me` 200、`/review` 200、`/courses/lessons/lesson_01` 200。
  - teacher 登录后 `/teacher` 200。
  - admin 登录后 `/admin` 200。
  - 未登录访问 `/me` 返回 307 到 `/login?callbackUrl=%2Fme`。
- Preview 音频 fallback 未通过：authenticated `/audio/phrase/lesson_01-phrase-001.mp3` 返回 404，原因是 CDN env 未配置且 mp3 不进入 Git。

## Ryan 控制台待办

1. Vercel Preview 和 Production 配置 `REGISTRATION_INVITE_CODE`，值由 Ryan 保存和发放，不写入仓库。
2. 如需初始化 owner，配置 `OWNER_BOOTSTRAP_TOKEN`，完成 owner 密码初始化后立即删除或轮换。
3. 如 5 个无密码历史账号需要本人设置密码，短期配置 `ACCOUNT_CLAIM_TOKEN`；不需要时不要配置。
4. 配置完成后重新触发 Preview 和 Production 构建，并复测注册邀请码控制。

## 当前停手规则

仍然停手：不打印任何 token，不把 token 写入文档或 Git，不发送真实邮件，不接管真实账号，不读取 magic-link token 或 session cookie。生产 merge/deploy 需等 `REGISTRATION_INVITE_CODE` 与课程音频 CDN base URL 等生产环境阻塞确认完成。
