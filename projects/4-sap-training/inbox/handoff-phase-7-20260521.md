# Phase 7 交接 · 2026-05-21

- updated_by: codex
- updated_at: 2026-05-22T08:04:26+09:00
- branch: codex/phase-7-launch
- scope: Phase 7「上线合规 + 内测扩盘准备」

## Commits

- `9c22fc3` fix(auth): magic link confirm intermediate page to defeat email scanners
- `f1696b5` fix(rbac): audit all API + teacher pages for session/role/student isolation
- `58d3d2e` feat(rate-limit): upstash redis sliding-window limits for login/upload/feedback (soft-dep)
- `589a0ca` feat(observability): sentry nextjs sdk for client/server/edge (soft-dep)
- `b5661af` feat(privacy): /privacy page + consent checkbox + recording disclosure
- `26e2dbb` feat(privacy): soft delete recordings + student delete API + 30d hard cleanup cron
- `0165d84` docs(ops): r2 lifecycle neon backup and capacity monitoring
- `1076d88` ci: github actions for typecheck/lint/build on PR + main push
- `c13e12d` chore: prettier + husky + lint-staged pre-commit hooks
- `030692f` docs: STUDENT_GUIDE + TEACHER_GUIDE + ADMIN_OPS
- `eb9843d` chore(state): record Phase 7 launch readiness + meta schema 1.4.0
- `212016a` fix(cron): add cleanup schedule and refresh Phase 7 env status
- `67097a2` fix(rate-limit): include auth signin in middleware matcher

## 凭据状态

只检查本地 `.env.local` 是否存在相关 key；未记录任何 secret 值。

| Env var | 本地状态 | 生产侧动作 |
|---|---|---|
| `CRON_SECRET` | present | 依赖 cron 前确认 Vercel env 中存在同名 key |
| `NEXT_PUBLIC_SENTRY_DSN` | present | 确认 Vercel env 与 Sentry project events |
| `UPSTASH_REDIS_REST_URL` | present | 确认 Vercel env |
| `UPSTASH_REDIS_REST_TOKEN` | present | 确认 Vercel env |

## 实现摘要

- Magic-link 邮件现在指向 `/login/confirm?token=...&email=...&callbackUrl=...`；只有用户点击确认按钮才会进入 Auth.js callback。
- RBAC 审计证据已写入 `logs/phase7-rbac-audit.md`。
- 为 auth signin、recording upload signing、teacher feedback 增加 Upstash rate limit。
- 为 client/server/edge 增加 Sentry Next.js SDK 配置。
- 新增 `/privacy` 页面；`/login` 在发送 magic link 前要求勾选隐私同意；录音面板显示上传/隐私披露。
- 通过 migration `0002_jittery_spiral.sql` 增加 `recordings.deleted_at`，并已成功迁移到 Neon。
- 学生 `DELETE /api/recordings/:id` 会软删除自己的录音；学生/讲师录音 GET API 隐藏软删除 row。
- `GET /api/cron/cleanup-recordings` 会硬删除 30 天前已软删除的录音 DB row 和 R2 object，并由 Bearer `CRON_SECRET` 保护。
- `web/vercel.json` 将清理任务安排在每日 UTC 03:00。
- 新增 CI workflow `.github/workflows/ci.yml`；当 `DATABASE_URL` 是 mock URL 时，CI build 使用 JSON fallback。
- 在 web 子项目中配置 Prettier、ESLint CLI、husky 和 lint-staged。
- `_meta.json` 升级到 schema `1.4.0`；Project 4 state 已更新。

## 验证

- `npm run drizzle:generate`：PASS，生成 `0002_jittery_spiral.sql`。
- `npm run drizzle:migrate`：PASS，migration 已成功应用。
- `npm run typecheck`：PASS。
- `npm run lint`：PASS，仅有既有 warning。
- `npm run build`：PASS，有 warning。
- CI mock build：PASS，命令为 `CI=true DATABASE_URL=postgres://mock:mock@localhost:5432/mock AUTH_SECRET=... NEXTAUTH_URL=http://localhost:3000 npm run build`。
- 本地 dev browser smoke：
  - `/privacy` 可渲染，隐私文本包含 no-AI-training 声明。
  - `/login`：勾选隐私同意前发送按钮禁用，勾选后启用。
  - `/login/confirm?token=test-token&email=test@example.com&callbackUrl=/dashboard` 可渲染确认页并显示目标邮箱。
- 本地 dev API smoke：
  - 未登录 `/api/recordings`：401。
  - 未登录 `/api/cron/cleanup-recordings`：401，因为存在 `CRON_SECRET`，要求 Bearer header。
  - auth signin rate limit：重复 no-CSRF POST smoke 后触发 429；该测试未发送真实 magic-link 邮件。

## 文档

- `projects/4-sap-training/web/docs/STUDENT_GUIDE.md`：119 行。
- `projects/4-sap-training/web/docs/TEACHER_GUIDE.md`：131 行。
- `projects/4-sap-training/web/docs/ADMIN_OPS.md`：202 行。

## 未运行 / 需要 Ryan

- Codex 未运行真实 Yahoo/Outlook 邮箱注册；需要用户可查看的邮箱。
- 未触发 Sentry test error；请在 Vercel env 部署后确认。
- 未触发 GitHub Actions 线上 PASS，因为 Phase 7 规则禁止 Codex push。
- 未使用有效 Bearer token 运行 hard-delete cron，避免交接阶段执行破坏性清理。
- 未端到端测试 authenticated student delete UI，因为 Codex 没有创建或接管真实用户 session。

## Warning / 残余风险

- `npm run lint` 报告 `RecordingHistory`、teacher recording clients、`lib/db/index.ts`、`scripts/convert-content.mjs` 中的既有 warning；无 lint error。
- `npm run build` 报告 Sentry setup warning：缺少 `onRequestError`、global error handler，以及 Sentry client config rename 建议。
- `npm run build` 报告 `@upstash/redis/nodejs.mjs` 的 Upstash Edge-runtime warning；matcher 修复后，本地 runtime signin rate-limit smoke 仍返回 429。
- Postgres driver 在 build/migrate 期间打印 SSL-mode deprecation warning。未打印 secret 值。
- Sentry 让 shared First Load JS 增至约 173 kB，仍低于 Phase 5 的 500 kB 上限。

## 停手点

Phase 7 实现和本地验证已完成。停在这里等待 Ryan / Claude 验收。不要 merge main、删除分支、push 或开始任何 Phase 8 工作。
