# sap-jp.training 昨晚 handoff 管理员审查 · 2026-05-22

- updated_by: codex
- updated_at: 2026-05-22T08:50:46+09:00
- scope: 作为网站管理员和架构师，审查 2026-05-21 夜间至 2026-05-22 早间的 Project 4 网站 handoff、阻塞项和对应代码。

## 审查范围

本轮重点查看以下 handoff / need-input：

- `inbox/handoff-phase-7-20260521.md`
- `inbox/handoff-site-audit-20260521.md`
- `inbox/handoff-sap-project-japanese-content-audit-20260521.md`
- `inbox/handoff-student-japanese-self-training-20260521.md`
- `inbox/handoff-student-learning-home-20260521.md`
- `inbox/handoff-site-ledger-20260521.md`
- `inbox/handoff-admin-ops-dashboard-20260521.md`
- `inbox/handoff-auth-credentials-roles-20260522.md`
- `inbox/handoff-tts-audio-recordings-20260521.md`
- `inbox/handoff-doc-language-policy-20260522.md`
- `inbox/handoff-public-sync-20260522.md`
- `inbox/need-input-site-audit-20260521.md`
- `inbox/need-input-tts-public-deploy-20260521.md`
- `inbox/need-input-public-sync-20260522.md`

## 主要发现

| 优先级 | 发现 | 风险 | 本轮处理 |
|---|---|---|---|
| P0 | `handoff-auth-credentials-roles-20260522.md` 记录 owner 邮箱公开注册自动获得 `student/teacher/admin`。实际代码确认没有邮箱验证或 bootstrap token。 | 任何知道 owner 邮箱的人，在 owner 未完成密码初始化前可能抢注/设置密码并获得 admin。 | 已修改 `/api/auth/register`：owner 邮箱必须提交一次性 `OWNER_BOOTSTRAP_TOKEN`，否则返回 403。 |
| P0 | 历史 magic-link / 无密码账号可以通过公开注册直接设置密码。 | 知道学员或讲师邮箱的人可能接管历史账号，读取录音、进度、反馈等私有数据。 | 已修改 `/api/auth/register`：已有无密码账号设置密码必须提交一次性 `ACCOUNT_CLAIM_TOKEN`。 |
| P1 | 私有训练站点只有登录墙，但自助注册无门槛会让课程内容变成“注册即可看”。 | 未付费或未邀请用户可注册为学生并访问课程、音频和训练内容。 | 已加入生产注册闸门：生产环境必须配置 `REGISTRATION_INVITE_CODE`；未配置时关闭公开注册。登录页增加邀请码字段。 |
| P1 | 公网同步 handoff 已正确停在 push/deploy/R2/Neon migration 前，但 need-input 还没有覆盖新增的 auth hardening env。 | 即使代码加固，生产 env 不配置也无法完成安全上线。 | 新增 `need-input-auth-hardening-20260522.md`，要求确认邀请码、owner bootstrap、历史账号认领 token。 |
| P1 | TTS 音频已生成 1543 个 mp3，但 `.gitignore` 排除 mp3。 | Git-based Vercel deployment 不会包含本地音频；学生上线后可能看得到播放器但听不到音频。 | 继续保留为外部发布阻塞项，不执行上传或 force-add；等待 `need-input-public-sync-20260522.md` 的音频策略选择。 |
| P1 | `0003_auth_credentials_multi_role.sql` 未应用生产 DB。 | 生产仍无法使用新的用户名/密码与多角色模型。 | 不执行生产 migration；继续作为公网同步阻塞项。 |
| P2 | 多份 handoff 提到 authenticated student/teacher/admin E2E 未运行。 | 未验证真实 session 下 `/me`、课程播放、录音、反馈、admin 视觉路径。 | 保留阻塞；需要测试账号/session 授权后执行。 |
| P2 | 早期 handoff 出现 intermittent `.next` generated artifact build 报错。 | 可能误判为代码问题或掩盖真实构建不稳定。 | 后续 public-sync 已跑通 build；本轮再次跑通 typecheck/lint/build。 |

## 已补的代码与文档

- `web/app/api/auth/register/route.ts`
  - 生产环境注册需要 `REGISTRATION_INVITE_CODE`。
  - owner 邮箱初始化需要 `OWNER_BOOTSTRAP_TOKEN`。
  - 历史无密码账号认领需要 `ACCOUNT_CLAIM_TOKEN`。
  - 返回角色改为使用真实写入/保留的角色集合。
- `web/app/login/LoginClient.tsx`
  - 注册表单增加邀请码字段。
- `web/lib/admin/ops-dashboard.ts`
  - admin 环境变量检查增加注册邀请码、历史账号认领 token、owner bootstrap token。
- `web/docs/ADMIN_OPS.md`
  - 补充生产注册、owner 初始化、历史账号认领和 token 轮换规则。
- `web/docs/SITE_ARCHITECTURE.md`
  - 补充生产注册和账号认领边界。
- `web/docs/STUDENT_GUIDE.md`
  - 学生注册说明增加邀请码。
- `web/docs/TEACHER_GUIDE.md`
  - 讲师账号开通说明区分新注册与历史账号认领。

## 未处理 / 仍需 Ryan 确认

- 是否允许 push/PR 和 Vercel deploy。
- 音频发布策略：Git force-add、R2/CDN、或 Vercel artifact deploy。
- 是否允许对目标 Neon 执行 migration `0003_auth_credentials_multi_role.sql`。
- 生产 `REGISTRATION_INVITE_CODE`、`OWNER_BOOTSTRAP_TOKEN`、`ACCOUNT_CLAIM_TOKEN` 的生成、配置、使用和轮换。
- 测试 student/teacher/admin 账号或 session 授权。
- Sentry、Upstash、Resend、Search Console / Safe Browsing 控制台检查。

## 验证结果

- `npm run typecheck`：PASS。
- `npm run lint`：PASS。
- `npm run build`：PASS；保留既有 Sentry/OpenTelemetry critical dependency warning 与 Postgres SSL-mode warning。
- 本地 dev server `REGISTRATION_INVITE_CODE=dev-invite npm run dev -- --hostname 127.0.0.1 --port 3213`：PASS，测试后已停止。
- 注册 API smoke：
  - `{}` -> `400 invalid_email`。
  - 有效学生注册但不带邀请码 -> `403 invite_required`。
  - owner 邮箱带测试邀请码但不带 owner bootstrap token -> `403 owner_bootstrap_required`。
- `/login?mode=register`：PASS，注册表单包含 `邀请码` 字段。

## 管理员结论

昨晚 handoff 的记录质量总体合格：多数生产动作都正确停在 need-input，没有擅自 push、deploy、迁移生产 DB 或上传音频。最大问题在 auth handoff：它把 owner bootstrap 和历史账号密码认领作为普通公开注册处理，属于上线前必须修掉的权限漏洞。本轮已在本地代码层修复，并把生产 env 决策单独写入 need-input。
