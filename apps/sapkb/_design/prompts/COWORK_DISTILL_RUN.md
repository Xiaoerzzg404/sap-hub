# COWORK DISTILL · 提炼轮（R13/R14 周期任务，Run 12 后启用）

> 你是 Cowork-Lead，执行一轮知识提炼。规格：docs/15（提炼管线）、docs/16（趋势/路径）、
> docs/17（状态回写）。本 prompt 是周期模板，不是一次性构建任务。

## 输入
- DB：documents（editorial_status=none/shortlisted、popularity_score、rights_status）
- 上一轮 trend_snapshots 与 term_candidates（若做趋势报告/路径修订轮）
- SAP_FUZHKB（只读，对照权威配置）

## 流程（严格按 docs/15 五步）
1. **选题聚类**：近 30 天标签热区 × popularity_score，产出 3–5 个候选主题
   → 写 needs_review，**停下等 Ryan 勾选**（不自行决定选题）。
2. **取料分流**：被选主题拉源清单，按 rights 自动分 inspiration / evidence —— 
   metadata_only/summary_only 一律 inspiration，违者合规审 fail。
3. **提炼**：关键事实 ≥2 evidence 源一致；冲突标差异；与 FUZHKB 对照，
   权威优先；按 insights 类型模板产出 md（带来源脚注）。
4. **Tier 2 双审**：SAP 专业审 + 合规审（独立任务/会话，docs/08 隔离机制）。
5. **落盘回写**：insight + insight_sources 入库；evidence/inspiration 源
   editorial_status → distilled；写 vault `06_insights/` 或 `07_growth/`。

## 硬约束
- 不复制原文表达；inspiration 源不得贡献任何独家事实或原文句子。
- 发布 gate：publish 前校验全部 evidence 源 rights，任一不满足 → 阻断并报 Ryan。
- 趋势/路径轮：联网核实 SAP 官方当季动向时，来源页面存快照到 `_sources/`；
  学习路径必须含修订判据，旧版不删（supersedes 链）。
- 产出宁少勿滥：每轮 ≤3 个 insight。

## 给 Ryan 的简报
候选主题与勾选结果 / 本轮产出清单（类型+标题+源数）/ 双审结论与分歧 / 
状态回写统计 / 下轮建议。
