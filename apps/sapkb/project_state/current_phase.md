# 当前阶段

**Run 10 · R13 知识提炼 distill（版权角色硬隔离）— 已完成并通过双审（2026-06-10）**

- distill.create_insight：从源文档建 insight（5 类型），写 06_insights md + insight_sources + 源置 editorial_status=distilled。
- **版权/真实性硬隔离（最高优先，已双审验证）**：evidence/counterpoint **只能**来自授权全文
  (user_imported/license_purchased/own_content/fulltext_allowed/derivative/commercial)；
  metadata_only/summary_only/unknown/blocked/takedown 源**只能 inspiration**，写库前 raise 拒绝（防引用不存在的全文事实=编造）。
- 无 evidence 的 insight 标"选题卡/不得陈述未核实事实"；status=draft、reviewed_tier=2（Tier2双审）、不发布。
- CLI insight-new / insights-list。单测 6 套 29 用例全绿。

**完整内容生产链已通**：采集(1457篇,合规) → 去重 → 分类/标签 → 热度/趋势 → 选题 shortlist →
**提炼 insight(版权硬隔离,Tier2)** → 草稿（发布永远人工）。

下一步：Run 11（insight LLM 据 evidence 成稿 / R15 发布台账 publications / 学习路径）。
