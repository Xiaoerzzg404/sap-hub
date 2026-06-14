# 当前阶段

**Run 14 · 日常运营化 — 已完成并通过双审（2026-06-14）**

- 每日 runner 重构：源选择改为【自动取 yaml 中 type∈{csdn_api,rss} 的真实可达源】(当前 9 个)，
  修正旧版手写白名单只 3 个的漂移（Henry/老鸟/SAPmatinal/3 新博主之前没进每日采集，现已纳入）。
  采集后接 recompute-popularity + export-brief —— 每天 06:30 自动：采集新文→重算热度→产新选题简报。
- 新增 cli.py status：一屏系统健康（总量/全文比/平台/top作者/insights/publications/watch/最近采集），只读。
- 06:30 launchd 指向同一脚本路径，自动启用新行为，无需改 plist。单测 6 套全绿。

**系统进入全自动日常运营**：每天自动采集 9 源(汪子熙等全部优先作者+SAP社区+官方AI)→分类标签→热度→选题简报。

下一步：扩源/RAG 质量/真实全文实战/与 Insight Desk 对接（需 Ryan 定向）。Codex token 恢复后重派机械活。
