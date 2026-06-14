# 交接 · sap-jp.training 本地站点审计 · 2026-05-21

- updated_by: codex
- updated_at: 2026-05-22T08:04:26+09:00
- branch: codex/sap-jp-content-audit-20260521
- scope: 本地站点审计 + 小范围 lint/录音刷新逻辑清理

## 已完成

- 读取 `AGENTS.md`、Project 4 instructions、state 和最新 handoff。
- 跑 baseline：
  - `git status --short`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
- 在 `http://127.0.0.1:3210` 启动本地 dev server。
- 对所有请求页面执行未登录 smoke。
- 对 `/api/recordings`、`/api/teacher/recordings`、`/api/progress/events` 执行未登录 API smoke。
- 修复录音 refresh hooks、讲师录音 refresh hooks、过期 eslint-disable、未使用转换脚本 helper 中已确认的 lint warning。
- 重新运行 `npm run typecheck`、`npm run lint`、`npm run build`。
- 写入审计日志：`projects/4-sap-training/logs/site-audit-20260521.md`。
- 写入 need-input：`projects/4-sap-training/inbox/need-input-site-audit-20260521.md`。

## 验证摘要

- `npm run typecheck`：PASS。
- `npm run lint`：PASS，0 warning。
- `npm run build`：PASS，存在已知 Sentry/pg warning。
- 未登录公开页：
  - `/`、`/login`、`/privacy`：200。
- 未登录受保护页：
  - `/dashboard`、`/courses`、`/courses/lessons/lesson_01`、所有请求的 `/speaking/*`、`/roleplay`、`/assignments`、`/review`、`/teacher`、`/teacher/recordings`、`/teacher/recordings/[id]`、`/teacher/review-terms`：307 到 login callback。
- 未登录 API：
  - `/api/recordings`：401。
  - `/api/teacher/recordings`：401。
  - `/api/progress/events`：401。

## 未运行

Authenticated E2E 未运行，因为没有可用的测试 student/teacher session，也没有授权创建用户或读取本地 magic-link token。

阻塞流程：

- 学员录音生命周期。
- 云端录音 sign/PUT/PATCH/list。
- 讲师录音复核和反馈保存。
- 学员 `/review` 反馈展示。
- 跨用户 / 班级范围 API RBAC。

## 备注

- 在 dev 活跃时运行 `next build` 后，曾出现一次短暂的 Next dev-server `/` 500。它符合已知 stale `.next`/RSC manifest 类型；停止 dev、清理生成的 `.next`、重启 dev 后 `/` 恢复 200。
- 当前工作区包含另一组未 staged 的 `japanese-coach` / self-training scaffold，包括 `web/data/japanese-coach.json`、`web/lib/japanese-coach.ts`、`web/types/japanese-coach.ts`、`web/components/lesson/JapaneseCoachPanel.tsx`、`web/components/pages/JapaneseSelfTrainingClient.tsx`、`web/app/speaking/self-training/` 和相关页面/nav 改动。它被视作审计 commit 之外的并行工作。

## 下一步

等待用户确认 `need-input-site-audit-20260521.md` 中的问题；随后使用明确提供的测试账号和权限运行 authenticated student/teacher E2E 矩阵。
