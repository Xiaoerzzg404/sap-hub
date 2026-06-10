# 交接 · SAP 日语训练站 A/B 背景说明已补齐 · 2026-06-10

- updated_by: codex
- updated_at: 2026-06-10T11:05:00+09:00
- status: handoff_ready

## 本轮做了什么

为后续 Claude / 其他 agent 接手 SAP 日语训练站，补了一套明确的 A/B 双版本背景说明，避免后续只拿到碎片化上下文。

## 新增/更新文件

- `/Users/openclawxiaoer/sap-hub/projects/4-sap-training/docs/sap-jp-training-site-a-b-handoff_20260610.md`
- `/Users/openclawxiaoer/sap-hub/projects/4-sap-training/CLAUDE.md`
- `/Users/openclawxiaoer/sap-hub/projects/4-sap-training/PROJECT_MAP.md`
- `/Users/openclawxiaoer/sap-hub/projects/4-sap-training/state/sap_jp_training_course.json`
- 本交接文件

## 文档现在明确了什么

- A 是什么：`web/` 下的本地升级版主线
- B 是什么：`https://sap-jp.training` 的已发布公网历史版，以及它的本地静态备份
- A/B 当前状态：都已被接入本机 Insight Desk
- 功能定位差异：A 继续开发，B 主要做对照/备份
- 后续默认策略：Claude 应优先继续完善 A，而不是把 B 当主开发线
- 风险边界：本地接入不等于公网替换；B 备份不是生产动态替代物

## 建议后续第一步

Claude 若继续接手网站工作，先读：

1. `AGENTS.md`
2. `AGENT_GUARDRAILS.md`
3. `_instructions.md`
4. `CLAUDE.md`
5. `docs/sap-jp-training-site-a-b-handoff_20260610.md`
6. `state/sap_jp_training_course.json`
7. `inbox/handoff-insight-desk-training-sites-20260610.md`

然后优先补一份显式的 `A/B 功能差异清单`，把“升级很多”落成可执行列表。
