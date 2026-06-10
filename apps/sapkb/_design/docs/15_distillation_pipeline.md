# 15｜知识提炼管线（R13，v3.1 新增）

> R13：从内容系统中提炼出知识、经验、SAP 顾问成长干货。
> 核心实体：**insights**（提炼产物）——原始文章是矿石，insights 是冶炼出来的金属。
> 提炼是版权上最敏感的一环，本管线把"能不能用这篇"做成结构约束，不靠自觉。

## 一、提炼产物的五种类型（insights.type）

| 类型 | 形态 | 例子 | 去向 |
|---|---|---|---|
| knowledge_card | 知识卡（1 屏，单事实/单配置点） | "F110 付款方式从 FBZP 的哪一层读取" | 进 vault 06_insights/，可聚合进课程/FUZHKB 候选 |
| experience_note | 经验条（坑/对策，含场景） | "S/4 迁移后 FAGLFLEXA 报表为什么不更新" | 同上 + 干货选题池 |
| growth_article | 顾问成长干货稿（成体系长文） | "FICO 顾问三年到独立 Lead 的能力清单" | 干货流水线 → 公众号/小红书 |
| trend_report | 季度趋势报告 | 见 docs/16 | 自媒体 + 你的战略输入 |
| learning_path | 学习路径（滚动修订版本化） | "FICO 顾问的 SAP AI 学习路径 v3" | 见 docs/16 |

## 二、提炼管线（五步，每步有 gate）

```text
① 选题（聚类）          Cowork-Worker 周期跑：按 标签热区 × popularity_score ×
                        editorial_status=none 聚类出候选主题（如"近 30 天 12 篇都在谈
                        Universal Journal 期末关账"）→ 候选落 needs_review，你勾选
② 取料（版权过滤）      对入选主题拉源文档清单，按 rights 自动分流：
                        - metadata_only/summary_only → 只能作 inspiration（选题启发）
                        - user_imported(scope=个人学习) → 可读全文取事实，输出必须重写
                        - derivative/commercial/own  → 可作 evidence 引用
③ 提炼（Cowork 高认知）  多源交叉：同一事实 ≥2 源一致才进"关键事实"；冲突标差异；
                        与 SAP_FUZHKB 对照（权威优先）；产出按类型模板写 md
④ 审核（Tier 2 双审）    SAP 专业审（事实/tcode/配置路径）+ 合规审（来源角色合法、
                        无成段照搬、metadata 源没被当 evidence 用）→ 双过才 approved
⑤ 落盘与状态回写        insight 写 vault；insight_sources 落库；
                        所有 evidence/inspiration 源文档 editorial_status → distilled
```

## 三、版权的结构性约束（重点）

`insight_sources.role` 三档是硬约束，不是备注：

- **inspiration**：metadata_only 的源**只能**挂这一档——它只贡献"这个话题值得写"，
  提炼稿不得出现其原文表达或独家事实（Tier 2 合规审 checklist 必查项）。
- **evidence**：要求 rights ∈ {derivative, commercial, own_content, fulltext_allowed}，
  或 user_imported 且产出仅作事实重写、不复制表达。
- **counterpoint**：反方观点，引用规则同 evidence。

发布前自动校验：`SELECT` 该 insight 的全部 evidence 源，任一 rights 不满足 → 阻断发布。

## 四、与 FUZHKB 的回流（参考层 → 权威层的唯一通道）

knowledge_card 经你**人工验证**（在系统里实测过）后，可标记 `promote_to_fuzhkb`：
由你手动改写沉淀进 SAP_FUZHKB 的 Configuration Facts——保持既有铁律：单向、显式确认、
Agent 不直接写权威库。

## 五、节奏建议

- 周一晚：选题聚类产出候选（自动）→ 你 10 分钟勾选。
- 周内：Cowork 提炼 2–3 个 insight（量随你的 review 带宽，宁少勿滥）。
- 与既有 21:30 干货流水线的关系：本管线产出 growth_article 后，
  以 inventory 池条目身份进干货流水线（它管发布编排，本管线管知识质量）。
