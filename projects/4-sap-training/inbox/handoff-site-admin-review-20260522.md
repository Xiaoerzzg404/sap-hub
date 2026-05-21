# 交接 · 昨晚网站 handoff 管理员审查与修复 · 2026-05-22

- updated_by: codex
- updated_at: 2026-05-22T08:52:01+09:00
- branch: codex/sap-jp-content-audit-20260521
- scope: 审查 2026-05-21 夜间至 2026-05-22 早间网站 handoff，修复可本地处理的 auth / 注册 / 运维文档风险。

## 已审查

- Phase 7、站点审计、内容审计、自训、学员首页、site ledger、admin dashboard、账号密码/RBAC、TTS 音频、中文文档规则、公网同步，以及对应 need-input。
- 重点复核了注册、角色、登录墙、录音 API、讲师录音范围、admin 只读面板和公网同步阻塞项。

## 已修复

- 修复 owner 公开注册自动获得 admin 的风险：owner 邮箱现在必须带一次性 `OWNER_BOOTSTRAP_TOKEN`。
- 修复历史无密码账号可被知道邮箱的人认领的风险：已有无密码账号设置密码必须带 `ACCOUNT_CLAIM_TOKEN`。
- 修复私有课程站点“注册即可看内容”的上线风险：生产环境必须配置 `REGISTRATION_INVITE_CODE`；未配置时关闭公开注册。
- 登录注册 UI 增加邀请码字段。
- admin 环境变量检查增加注册邀请码、账号认领 token、owner bootstrap token。
- 更新 `ADMIN_OPS.md`、`SITE_ARCHITECTURE.md`、`STUDENT_GUIDE.md`、`TEACHER_GUIDE.md`。
- 写入审查报告 `logs/site-handoff-admin-review-20260522.md`。
- 写入确认单 `inbox/need-input-auth-hardening-20260522.md`。

## 仍未执行

- 未 push、未创建 PR、未部署 Vercel。
- 未上传 R2/CDN、未 force-add mp3、未执行 Vercel artifact deploy。
- 未执行 Neon 生产 migration `0003_auth_credentials_multi_role.sql`。
- 未生成、读取、打印或写入任何 secret/token。
- 未创建或接管真实账号，未发送真实邮件。
- 未运行 authenticated student/teacher/admin E2E，因为仍缺测试账号/session 授权。

## 并行未纳入

提交本交接前，工作区出现了非本轮 owns 的音频/R2 相关改动，包括 `web/components/audio/*`、`web/lib/course-audio.ts`、`web/scripts/upload-course-audio-r2.mjs`、`web/package.json` 以及部分音频部署文档/env 检查。本轮不 stage、不回退这些改动，避免混入 handoff 审查提交。

## 验证

- `npm run typecheck`：PASS。
- `npm run lint`：PASS。
- `npm run build`：PASS；保留既有 Sentry/OpenTelemetry critical dependency warning 与 Postgres SSL-mode warning。
- 本地 dev server `REGISTRATION_INVITE_CODE=dev-invite npm run dev -- --hostname 127.0.0.1 --port 3213`：PASS，测试后已停止。
- 注册 API smoke：
  - `{}` -> `400 invalid_email`。
  - 有效学生注册但不带邀请码 -> `403 invite_required`。
  - owner 邮箱带测试邀请码但不带 owner bootstrap token -> `403 owner_bootstrap_required`。
- `/login?mode=register`：PASS，注册表单包含 `邀请码` 字段。

未跑历史账号认领成功路径，因为这需要真实或测试 DB 中存在无密码账号；按护栏仍等待测试账号/session 授权。

## 下一步

Ryan 先回复 `need-input-auth-hardening-20260522.md` 与 `need-input-public-sync-20260522.md`。确认前继续停在本地审查与修复完成状态，不做任何外部发布或生产数据动作。
