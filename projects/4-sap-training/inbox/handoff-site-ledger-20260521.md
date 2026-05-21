# 交接 · sap-jp.training 站点 Ledger · 2026-05-21

- updated_by: codex
- updated_at: 2026-05-22T08:04:26+09:00
- branch: codex/sap-jp-content-audit-20260521
- scope: 本地站点历史台账、路由/内容 inventory snapshots、重建计划

## 已完成

- 新增零依赖本地 ledger CLI：`projects/4-sap-training/web/scripts/site-ledger.mjs`。
- 新增 package commands：
  - `npm run ledger:snapshot`
  - `npm run ledger:diff`
  - `npm run ledger:check`
  - `npm run ledger:rebuild-plan`
- 新增机器/人类文档：
  - `projects/4-sap-training/web/docs/SITE_CHANGE_LEDGER.md`
  - `projects/4-sap-training/web/ops/site-ledger/README.md`
  - `projects/4-sap-training/web/ops/site-ledger/config.json`
- 更新 `SITE_ARCHITECTURE.md`，让本地改订流程包含 before/after ledger snapshots、diff report 和 rebuild-plan refresh。
- ledger 记录 route inventory、预期 access boundary、middleware 覆盖、content/data counts、file hashes、package scripts、Git branch/commit、脏工作区路径和 restore safety。
- 第一次 ledger check 发现 `/me` 预期受保护但没有被 middleware 覆盖；已把 `/me/:path*` 加入 matcher。
- 生成初始和验证后 snapshots：
  - `projects/4-sap-training/web/ops/site-ledger/snapshots/2026-05-21T14-54-05-690Z__initial-site-ledger.json`
  - `projects/4-sap-training/web/ops/site-ledger/snapshots/2026-05-21T14-58-19-480Z__post-verification-site-ledger.json`
- 生成人类可读 reports：
  - `projects/4-sap-training/web/ops/site-ledger/reports/2026-05-21T14-54-05-690Z__initial-site-ledger.md`
  - `projects/4-sap-training/web/ops/site-ledger/reports/2026-05-21T14-58-19-480Z__post-verification-site-ledger.md`
  - `projects/4-sap-training/web/ops/site-ledger/reports/2026-05-21T14-58-19-480Z__diff.md`
- 生成最新指针：
  - `projects/4-sap-training/web/ops/site-ledger/latest.json`
  - `projects/4-sap-training/web/ops/site-ledger/CHANGELOG.md`
  - `projects/4-sap-training/web/ops/site-ledger/REBUILD_PLAN.md`
- 本轮已把 ledger 的 Markdown 输出模板改为中文，后续新生成报告也应保持中文说明。

## 验证

- `node --check scripts/site-ledger.mjs`：PASS。
- `npm run ledger:check`：PASS，0 errors、1 warning。
- `npm run lint`：PASS。
- `npm run typecheck`：清理 stale `.next` 后 PASS。
- `npm run ledger:snapshot -- --label post-verification-site-ledger`：PASS。
- `npm run ledger:diff -- --write`：PASS。
- `npm run ledger:rebuild-plan`：PASS。

## 未通过 / 已知既有问题

- `npm run build`：NOT PASS。
- Build 已通过 compile/type validation，但在 Next generated-artifact 阶段因 `.next` 下 ENOENT/module-not-found 变体失败，包括：
  - `.next/server/functions-config-manifest.json`
  - `.next/server/pages-manifest.json`
  - `.next/export/500.html -> .next/server/pages/500.html`
  - prerender 阶段缺少 generated chunks
- 这与此前 handoff 中记录的间歇性 Next/Sentry/generated-manifest 类型一致。ledger 代码没有 TypeScript 或 lint error。

## Restore Safety

- 最新 snapshot health：0 errors、1 warning。
- `restoreSafety.restoreSafe = false`，因为工作区已经有无关未提交改动。
- 当前 ledger 可用于观察和后续变更对比；只有在无关脏改动被 commit/stash 后重新生成 snapshot，才可作为干净灾备锚点。

## State 备注

- `projects/4-sap-training/state/sap_jp_training_course.json` 在本 handoff 前已经是 dirty。为了避免把无关 state 改动混入 ledger commit，我没有编辑它。

## 下一步

1. 复查并处理无关脏工作区项目。
2. 工作区干净后运行 `cd projects/4-sap-training/web && npm run ledger:snapshot -- --label clean-restore-anchor`。
3. 将既有 Next build generated-artifact 问题作为独立于 ledger 工具的问题处理。
