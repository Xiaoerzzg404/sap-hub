# sap-jp.training 本地站点审计 · 2026-05-21

- updated_by: codex
- updated_at: 2026-05-22T08:04:26+09:00
- cwd: `/Users/openclawxiaoer/sap-hub`
- app: `projects/4-sap-training/web`
- local target: `http://127.0.0.1:3210`
- smoke method: 使用 Node `fetch`，以 `redirect: "manual"` 请求本地 dev server
- screenshots: 未截图；浏览器证据使用下方 Node fetch status/location 记录

## 范围

允许写入范围限定为：

- `projects/4-sap-training/web`
- `projects/4-sap-training/logs`
- `projects/4-sap-training/state`
- `projects/4-sap-training/inbox`

未读取或修改 `systems/` 文件。未执行真实外部发布、R2 删除、DB reset、真实邮箱接管或麦克风 E2E。

## 启动读取

- 已读 `AGENTS.md`。
- 已读 `projects/4-sap-training/_instructions.md`。
- 已读 `projects/4-sap-training/state/sap_jp_training_course.json`。
- 已读当时最新 handoff：`projects/4-sap-training/inbox/handoff-phase-7-20260521.md`。

## Baseline

| 检查 | 结果 | 备注 |
|---|---:|---|
| `git status --short` | PASS | 任务开始时存在的脏文件在请求审计范围之外；未触碰、未 stage。 |
| `npm run typecheck` | PASS | 编辑前 baseline 通过。 |
| `npm run lint` | PASS with 8 warnings | warning 位于 recording refresh hooks、`lib/db/index.ts` 和未使用的 conversion script 代码。 |
| `npm run build` | PASS with warnings | 已知 Sentry setup warning 和 pg SSL-mode warning；build 完成。 |

## 已应用的小修复

| 区域 | 文件 | 修复 |
|---|---|---|
| 学员录音历史 | `web/components/audio/RecordingHistory.tsx` | 用 `useCallback` 包裹 `refresh`，并让 `useEffect` 依赖稳定 callback。 |
| 讲师录音详情 | `web/components/teacher/TeacherRecordingDetailClient.tsx` | 用 `useCallback` 包裹 `refresh`，并让 `useEffect` 依赖稳定 callback。 |
| 讲师录音列表 | `web/components/teacher/TeacherRecordingsClient.tsx` | 用 `useCallback` 包裹 `refresh`，并让 `useEffect` 依赖稳定 callback。 |
| DB pool singleton | `web/lib/db/index.ts` | 移除过期 `eslint-disable` directive。 |
| 内容转换脚本 | `web/scripts/convert-content.mjs` | 移除导致 lint warning 的未使用 legacy helpers/constants。 |

重新运行和 post-commit 验证时，当前工作区还包含一组独立、未 stage 的 `japanese-coach` / self-training scaffold。它包括 `web/data/japanese-coach.json`、`web/lib/japanese-coach.ts`、`web/types/japanese-coach.ts`、`web/components/lesson/JapaneseCoachPanel.tsx`、`web/components/pages/JapaneseSelfTrainingClient.tsx`、`web/app/speaking/self-training/` 和相关 page/nav 改动。该 scaffold 被视为本审计 commit 之外的并行工作，未纳入审计 handoff。

## 修复后验证

| 检查 | 结果 | 备注 |
|---|---:|---|
| `npm run typecheck` | PASS | 当前工作区在处理未 stage japanese-coach scaffold 兼容性后通过。 |
| `npm run lint` | PASS | 0 errors，0 warnings。 |
| `npm run build` | PASS with warnings | 与 baseline/Phase 7 同类的非阻塞 Sentry setup、Upstash Edge-runtime、pg SSL-mode warning。 |
| Dev server | PASS | `npm run dev -- --hostname 127.0.0.1 --port 3210`。 |
| Dev cache recovery | PASS | build/dev 混跑导致 `/` 一次性 500（Next RSC manifest 状态）后，停止 dev、删除生成的 `.next`、重启 dev 并复测成功。 |

## 页面矩阵 · 未登录

预期：公开页返回 `200`；受保护页返回 `307` 到 `/login?callbackUrl=...`。

| Path | Expected | Actual | Evidence |
|---|---:|---:|---|
| `/` | 200 | 200 | title `SAP 日本项目实战日语口语训练平台` |
| `/login` | 200 | 200 | title `SAP 日本项目实战日语口语训练平台` |
| `/privacy` | 200 | 200 | title `SAP 日本项目实战日语口语训练平台` |
| `/dashboard` | 307 | 307 | `http://localhost:3210/login?callbackUrl=%2Fdashboard` |
| `/courses` | 307 | 307 | `http://localhost:3210/login?callbackUrl=%2Fcourses` |
| `/courses/lessons/lesson_01` | 307 | 307 | `http://localhost:3210/login?callbackUrl=%2Fcourses%2Flessons%2Flesson_01` |
| `/speaking` | 307 | 307 | `http://localhost:3210/login?callbackUrl=%2Fspeaking` |
| `/speaking/recording` | 307 | 307 | `http://localhost:3210/login?callbackUrl=%2Fspeaking%2Frecording` |
| `/speaking/shadowing` | 307 | 307 | `http://localhost:3210/login?callbackUrl=%2Fspeaking%2Fshadowing` |
| `/speaking/repeat-player` | 307 | 307 | `http://localhost:3210/login?callbackUrl=%2Fspeaking%2Frepeat-player` |
| `/speaking/micro-training` | 307 | 307 | `http://localhost:3210/login?callbackUrl=%2Fspeaking%2Fmicro-training` |
| `/speaking/consultant-output` | 307 | 307 | `http://localhost:3210/login?callbackUrl=%2Fspeaking%2Fconsultant-output` |
| `/roleplay` | 307 | 307 | `http://localhost:3210/login?callbackUrl=%2Froleplay` |
| `/assignments` | 307 | 307 | `http://localhost:3210/login?callbackUrl=%2Fassignments` |
| `/review` | 307 | 307 | `http://localhost:3210/login?callbackUrl=%2Freview` |
| `/teacher` | 307 | 307 | `http://localhost:3210/login?callbackUrl=%2Fteacher` |
| `/teacher/recordings` | 307 | 307 | `http://localhost:3210/login?callbackUrl=%2Fteacher%2Frecordings` |
| `/teacher/recordings/[id]` | 307 | 307 | 测试为 `/teacher/recordings/test-id`；`http://localhost:3210/login?callbackUrl=%2Fteacher%2Frecordings%2Ftest-id` |
| `/teacher/review-terms` | 307 | 307 | `http://localhost:3210/login?callbackUrl=%2Fteacher%2Freview-terms` |

## API 矩阵 · 未登录

| Endpoint | Expected | Actual | Body |
|---|---:|---:|---|
| `/api/recordings` | 401 | 401 | `{"error":"unauthorized"}` |
| `/api/teacher/recordings` | 401 | 401 | `{"error":"unauthorized"}` |
| `/api/progress/events` | 401 | 401 | `{"error":"unauthorized"}` |

## 功能矩阵

| 功能 | 状态 | 原因 / 证据 |
|---|---|---|
| 公开页渲染 | PASS | `/`、`/login`、`/privacy` 返回 200。 |
| 未登录受保护路由 | PASS | 所有受保护页面返回 307 且带 callback URL。 |
| 未登录 API auth 边界 | PASS | 目标 API 返回 401。 |
| lint-warning 清理 | PASS | `npm run lint` 现在返回 0 warning。 |
| 学员录音本地流程 | NOT TESTED | 需要 authenticated student session 和 media/fake-media 浏览器运行。 |
| 云端录音 sign -> PUT -> PATCH -> list | NOT TESTED | 需要 authenticated student session，并需要授权使用测试 R2 path。 |
| 讲师录音列表/详情/播放/反馈 | NOT TESTED | 需要 authenticated teacher session 和 seeded/enrolled student recording。 |
| 学员 `/review` 反馈显示 | NOT TESTED | 需要带讲师反馈的 authenticated student session。 |
| 跨用户 / 班级范围 RBAC | NOT TESTED | 需要测试 student + teacher 账号，以及授权创建/读取 login token 或使用提供的 session。 |

## 阻塞 / Need Input

Authenticated E2E 被有意停下，因为本地审计没有可用的测试 student/teacher session，且任务禁止猜测或接管真实登录流程。

已写 need-input 文件：

- `projects/4-sap-training/inbox/need-input-site-audit-20260521.md`

## 残余 Warning

- `npm run build` 仍打印 Sentry setup warning：缺少 `onRequestError`、缺少 global error handler、client config rename 建议。
- `npm run build` 仍打印 `@upstash/redis/nodejs.mjs` 的已知 Upstash Edge-runtime warning。
- `npm run build` 仍打印 pg SSL-mode deprecation/security warning。
- 这些 warning 已属于 Phase 7 warning 类型，本轮没有扩展成 Sentry/DB 配置任务。
