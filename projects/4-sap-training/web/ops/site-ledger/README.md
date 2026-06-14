# sap-jp.training 站点 Ledger

- updated_by: codex
- updated_at: 2026-05-22T08:04:26+09:00
- scope: sap-jp.training web app 的本地监控、历史台账和灾备索引

## 目的

本目录是 sap-jp.training 的本地站点台账。它记录站点发生了什么变化，但不改变产品本身。

它同时服务用户和 AI 工具：

- 人可以阅读 Markdown 报告和 changelog。
- AI 工具可以读取 `config.json` 和 `latest.json`。
- Git 仍然是恢复真实代码/内容的真相源。
- Secrets、本地 cache、`.next`、`node_modules` 和音频二进制都被排除。

## 命令

从 `projects/4-sap-training/web` 运行：

```bash
npm run ledger:snapshot -- --label before-content-change
npm run ledger:diff
npm run ledger:check
npm run ledger:rebuild-plan
```

## 文件

- `config.json`：稳定的机器可读范围和规则。
- `latest.json`：最新机器可读 snapshot。
- `snapshots/`：带时间戳的历史 snapshot。
- `reports/`：人类可读 snapshot 和 diff 报告。
- `CHANGELOG.md`：只追加的 ledger 时间线。
- `REBUILD_PLAN.md`：基于最新 snapshot 生成的当前重建清单。

## Restore Safety 规则

只有 `restoreSafety.restoreSafe` 为 `true` 时，一个 snapshot 才是干净恢复锚点。

如果工作区是脏的，ledger 仍会记录当前可观察状态，但仅凭它不足以重建未提交文件内容。把 snapshot 当灾备点前，请先 commit 或 stash 工作区。

## AI 工具契约

改动本地站点前，AI 工具应：

1. 读取 `AGENTS.md`、Project 4 护栏和本 README。
2. 运行 `npm run ledger:snapshot -- --label before-<task>`。
3. 进行范围内改动。
4. 运行 `npm run ledger:check`，再跑必要的 web 检查。
5. 运行 `npm run ledger:snapshot -- --label after-<task>`。
6. 在 Project 4 handoff 中写明 snapshot/report 路径。
