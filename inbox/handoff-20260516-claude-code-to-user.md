# handoff-20260516-claude-code-to-user

- agent：cowork（按大脑第②轮规格作为 claude-code 角色施工）
- 涉及：sap-hub 第②轮规格写入

## 已完成（仅本轮 3 件事，未越界）
1. 把第②轮文档每个 `=== 文件: 路径 ===` 块的内容原样写入对应路径：
   - 6 个 `projects/<n>-<name>/_instructions.md`
   - 6 个 `projects/<n>-<name>/sources.yaml`
   - 6 个 `projects/<n>-<name>/state/_index.json`（按文档末尾模板，仅替换 <n>/<name>）
2. 按 AGENTS.md 第 4 条格式 git commit。
3. 写本 handoff 报告。

## 给用户的提示（按第②轮文档收尾要求）
可去 Claude.ai 建 6 个 Project，把对应 `_instructions.md` 内容复制进各 Project 的“自定义指令”；知识文件后续由大脑分批提供。

## 不确定项
- 无。

## 下一步是谁的动作
- 用户/大脑：交付第③轮规格。
- 执行体：等指令，不主动启动任何业务动作；尤其不读、不分析、不改动 ~/news/studio。
