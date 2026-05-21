# SITE_CHANGE_LEDGER · sap-jp.training

- updated_by: codex
- updated_at: 2026-05-22T08:04:26+09:00
- scope: 人类和 AI 工具如何记录本地站点变更、版本历史和重建证据

## 用什么

本地站点 ledger 位于：

`projects/4-sap-training/web/ops/site-ledger/`

命令行工具是：

`projects/4-sap-training/web/scripts/site-ledger.mjs`

请从 `projects/4-sap-training/web` 运行命令。

## 标准流程

有意义的本地站点改动前：

```bash
npm run ledger:snapshot -- --label before-task-name
```

改动并验证后：

```bash
npm run ledger:check
npm run ledger:snapshot -- --label after-task-name
npm run ledger:diff -- --write
npm run ledger:rebuild-plan
```

## Ledger 记录什么

- Git branch、commit 和脏工作区路径。
- 页面路由和 API 路由。
- 预期 public/protected 路由状态和 middleware 覆盖。
- 运行时数据数量和 hash，包括 lessons、phrases、roleplays、assignments、glossary、library、coach data。
- 架构文件清单：pages、components、libs、scripts、docs、DB migrations、public assets、Project 4 course sources。
- Package scripts 和 dependency names。
- 人类可读 Markdown 报告，以及机器可读 JSON snapshot。

## Ledger 不记录什么

- `.env.local` 或部署设置里的 secret values。
- `.next`、`node_modules`、TypeScript build cache 或本地 audio cache。
- 音视频二进制，例如 `.mp3`、`.wav`、`.m4a`、`.mp4`。
- 真实学员数据、session cookies、signed R2 URLs、magic-link tokens 或私有反馈文本。

## 如何读取 Snapshot Health

- `error`：必需 route/file/security boundary 缺失；停手修复或写 need-input。
- `warning`：站点仍可观察，但 restore 或 access-control 可信度较低。
- `info`：ledger 层未发现问题。

只有 Git 工作区干净时，`restoreSafety.restoreSafe` 才是 `true`。脏 snapshot 可用于审计，但不能单独作为灾备恢复锚点；必须先 commit 或另行保存脏文件。

## 灾备恢复用途

生成或刷新重建指南：

```bash
npm run ledger:rebuild-plan
```

然后使用：

- `ops/site-ledger/REBUILD_PLAN.md`：给人看的重建步骤。
- `ops/site-ledger/latest.json`：机器可读的文件、路由、数据和 Git 证据。
- Git history：真正恢复代码/内容。

## 必需交接记录

任何 AI 工具改动 sap-jp.training 时，都应在 handoff 写清楚：

- before/after snapshot label；
- report path；
- `npm run ledger:check` 结果；
- `restoreSafety.restoreSafe` 是否为 `true`；
- 仍然保留的 warning。
