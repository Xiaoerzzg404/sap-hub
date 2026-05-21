# SITE_CHANGE_LEDGER · sap-jp.training

- updated_by: codex
- updated_at: 2026-05-22T08:20:13+09:00
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

## 2026-05-22 公网同步前版本顺序

本轮以 `main` 的 `3bcc778` 为公开同步前基线，当前整理分支是
`codex/sap-jp-content-audit-20260521`。昨晚更新已经能按真实执行顺序拆成以下版本：

| 顺序 | commit / 状态           | 目的                     | 文件范围                                                   | 公网前状态                     |
| ---: | ----------------------- | ------------------------ | ---------------------------------------------------------- | ------------------------------ |
|    0 | `576cd4e`               | 变更前 checkpoint        | 内容审查前恢复点                                           | 已提交                         |
|    1 | `eeae1fc`               | SAP 项目日语内容审校     | 课程 Markdown、生成 JSON、内容报告                         | 已提交                         |
|    2 | `03fa6cc`               | 本地站点审计和 lint 清理 | 录音 refresh hooks、审计报告、need-input                   | 已提交                         |
|    3 | `9526a82`               | 讲师教练台               | `/teacher`、coach data、teacher guide、convert metadata    | 已提交                         |
|    4 | `bdc7264`               | 学员日语自训             | lesson coach panel、`/speaking/self-training`、nav         | 已提交                         |
|    5 | `925edbf`               | Project 4 护栏           | `AGENT_GUARDRAILS.md` 与 guardrail handoff                 | 已提交                         |
|    6 | `2ac1869`               | `/me` 学员首页和架构文档 | `/me`、notes、Sentry build gating、SITE_ARCHITECTURE       | 已提交                         |
|    7 | `1759ad2`               | 站点 ledger              | `scripts/site-ledger.mjs`、snapshot/diff/rebuild plan      | 已提交                         |
|    8 | `d3ba920`               | admin 运维监控台         | `/admin`、ops dashboard、ADMIN_OPS                         | 已提交                         |
|    9 | `d0440b1`               | 密码登录与多角色 RBAC    | credentials auth、`user_roles`、middleware、migration 0003 | 已提交                         |
|   10 | `7aafb74`               | 中文文档规则和交接归档   | AGENTS、guardrails、handoff、site-ledger 文档中文化        | 已提交                         |
|   11 | `3cc1305`               | TTS/audio metadata       | TTS 脚本、TermCard、manifest、内容修正、生成 JSON          | 已提交；mp3 本体仍被 gitignore |
|   12 | 本轮 public sync commit | 公网同步前台账和停手确认 | state、handoff、need-input、ledger before/after reports    | 待提交                         |

恢复顺序：先恢复到目标 commit，再按对应 handoff 的验证命令重跑；音频若要公网可播放，必须先确认媒体策略，因为 `**/*.mp3` 当前不会随 GitHub/Vercel Git 部署进入生产。

## 必需交接记录

任何 AI 工具改动 sap-jp.training 时，都应在 handoff 写清楚：

- before/after snapshot label；
- report path；
- `npm run ledger:check` 结果；
- `restoreSafety.restoreSafe` 是否为 `true`；
- 仍然保留的 warning。
