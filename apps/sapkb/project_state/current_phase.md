# 当前阶段

**Run 09 · 内容情报层（热度+趋势+选题）— 已完成并通过双审（2026-06-10）**

- R12 热度 popularity_score：按 routing_policy 权重(manual_rating*3+log(1+repost)*2+platform_count+author_rating+distill_refs*2)
  算每篇缓存回 documents。`cli.py recompute-popularity`。1457 篇已评分。
- R14 趋势雷达：按季度聚合 category/module/sap_ai/csdn_tag → trend_snapshots(含真·上一自然季环比)；
  taxonomy 外高频(≥5)新词 → term_candidates(已含 tcode/table/cross_topics 排除)。`cli.py trend`。
- 选题 shortlist：按 热度+新近+SAP AI 优先 排候选，分类分组，供公众号/视频号选题。`cli.py shortlist [--category X]`。
  实测 SAP AI(MCP/ADT/AI Core)文章置顶。
- 单测 5 套 25 用例全绿。

**SAPKB → 内容生产桥已通**：1457 篇真实 SAP 文章可按热度/分类/SAP AI 优先出选题清单。

下一步：Run 10（选题→爆款联动 insight 提炼 R13 / 学习路径 R14 / 发布台账 R15）。
