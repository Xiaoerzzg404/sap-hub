# 交接 · 默认中文说明文档规则与昨日英文文档中文化 · 2026-05-22

- updated_by: codex
- updated_at: 2026-05-22T08:04:26+09:00
- branch: codex/sap-jp-content-audit-20260521
- scope: Project 4 / sap-jp.training 说明文档语言规则、昨日英文 handoff/report/docs 中文化、Codex memory 更新

## 用户请求

用户要求后续 Codex 做任务时尽量使用中文；除非明确要求日文，或 SAP 日语培训中必须保持日文自然表达的学习内容，否则说明类 Markdown 不要默认写英文。同时检查 2026-05-21 日语培训网站相关任务生成的英文说明文档，并改成中文。

## 已完成

- 在根 `AGENTS.md` 新增“语言与说明文档规则”。
- 将 `projects/4-sap-training/AGENT_GUARDRAILS.md` 改为中文，并补充说明文档默认中文规则。
- 将 2026-05-21 及 2026-05-22 凌晨延续任务中的主要英文 handoff、need-input、审计报告、站点架构/运维/ledger 文档改为中文。
- 将 `web/scripts/site-ledger.mjs` 的 Markdown 报告模板改为中文，避免后续新生成 ledger 报告继续默认英文。
- 新增 Codex memory note：
  `/Users/openclawxiaoer/.codex/memories/extensions/ad_hoc/notes/2026-05-22T08-04-26-default-chinese-docs.md`

## 保留原文的内容

- 文件名、路由、命令、环境变量、SQL、API 名称、状态值和 commit message 保持原文。
- SAP 日语课程中必须保持自然日文的学习内容、例句、对话、口播或录音文案不强行中文化。
- 旧 Phase 0-6 历史 handoff/prompt 未在本轮批量回改；本轮聚焦用户点名的“昨天”网站相关任务。

## 验证

- `node --check projects/4-sap-training/web/scripts/site-ledger.mjs`：PASS。
- 使用 `rg` 检查 Project 4 中本轮相关 Markdown 的英文标题残留；剩余匹配主要是旧 Phase 历史文档、课程输出模板、技术标识或专有名词。

## State / Commit 说明

- `projects/4-sap-training/state/sap_jp_training_course.json` 在本轮前已有并行 dirty changes。本轮没有编辑 state，避免混入无关状态历史。
- 当前工作区已有大量非本轮未提交改动；提交时应只 stage 本轮语言规则和中文化相关文件。

## 后续规则

以后新增或修改说明类 `.md` 前，先默认中文；交付前再扫一遍本轮 `.md`，主体是英文的说明文档先改成中文。
