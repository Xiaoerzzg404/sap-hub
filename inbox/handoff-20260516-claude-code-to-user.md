# handoff-20260516-claude-code-to-user

- 时间：2026-05-16T17:04:56+09:00 (Asia/Tokyo)
- agent：cowork (Claude，按大脑第②轮规格充当 claude-code 角色)
- 涉及：6 个 Project 指令正文 + sources 模板 + state/_index.json

## 已完成
1. 替换 6 个 `_instructions.md` 占位（第①轮"待大脑提供"），写入第②轮交付正文
2. 替换 6 个 `sources.yaml` 占位，写入第②轮起始模板
3. 为 6 个 Project 各建 `state/_index.json`，符合 `_schema/state.schema.json` 五个必填字段
4. git commit："claude-code: 填充 6 Project 指令与 sources（第②轮规格）"

## 用户的下一步动作
**去 Claude.ai 建 6 个 Project，把对应 _instructions.md 内容复制进各 Project 的"自定义指令"**：

| Claude.ai Project 名 | 复制源 |
|---|---|
| AI 情报 / sap-hub-1-ai-intel        | ~/sap-hub/projects/1-ai-intel/_instructions.md |
| SAP 情报 / sap-hub-2-sap-intel      | ~/sap-hub/projects/2-sap-intel/_instructions.md |
| SAP 内容 / sap-hub-3-sap-content    | ~/sap-hub/projects/3-sap-content/_instructions.md |
| SAP 教培 / sap-hub-4-sap-training   | ~/sap-hub/projects/4-sap-training/_instructions.md |
| SAP 人才 / sap-hub-5-sap-talent     | ~/sap-hub/projects/5-sap-talent/_instructions.md |
| 法人经营 / sap-hub-6-biz-ops        | ~/sap-hub/projects/6-biz-ops/_instructions.md |

知识文件（课程内容、情报源补充、merge-plan 等）后续由大脑分批提供。

## 不确定项
- 无（本轮规格清晰，6 个文件结构一致，已按蓝图铁律 1/3/4 执行）

## 风险提示
- Project 3 的"合并落地"明确要求执行体先读 ~/news/studio 现有脚本再写 merge-plan，
  下一轮启动时第一件事是这个，**不允许跳过直接改流水线**
- Project 5 提到人才/企业个人信息不进 git；本轮只建结构，无个人数据
