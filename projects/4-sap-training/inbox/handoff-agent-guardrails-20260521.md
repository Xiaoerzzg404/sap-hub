# 交接 · Project 4 Agent 护栏 · 2026-05-21

- updated_by: codex
- updated_at: 2026-05-22T08:04:26+09:00
- scope: SAP 日语培训内容、站点、数据、录音、UX 和运营工作的跨 agent 强制规则

## 已完成

- 新增 `projects/4-sap-training/AGENT_GUARDRAILS.md`。
- 从仓库级 `AGENTS.md` 链接该护栏。
- 从 Project 4 `_instructions.md` 链接该护栏。
- 新增一条 Codex memory note 到 `.codex/memories/extensions/ad_hoc/notes/`。
- 本轮按用户要求补充“默认中文说明文档”规则，并将护栏正文改为中文。

## 规则覆盖

- 强制启动读取顺序。
- 停手条件和 need-input 处理。
- 真相源优先级。
- 范围控制和脏工作区处理。
- 语言与说明文档规则。
- 数据、隐私、权限、录音、反馈、内容质量、SAP 事实、日语自然度、UX、性能、验证、交接和历史规则。

## 未完成

- 本轮没有编辑 Project state，因为 `state/sap_jp_training_course.json` 已经包含并行未提交改动。为了避免混入无关历史，状态更新以本 handoff 记录为准。

## 下一步

后续 Project 4 任务应在读取 root `AGENTS.md` 后立即读取 `AGENT_GUARDRAILS.md`，并在结束前检查说明类 Markdown 是否默认使用中文。
