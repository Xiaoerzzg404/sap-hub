# SAPKB 本地内容知识库 · 设计包 v3.1

版本：v3.1（= v3.0 修复版 + R11–R15 五项新需求设计）
日期：2026-06-10
作者：Claude（v1=ChatGPT 初稿 → v2.1=Claude 重构 → v3.0=二次评审修复 → v3.1=持续运营层）

## v3.1 新增（R11–R15，一句话版）

> v3.0 解决"建得起来"；v3.1 解决"转得起来"——系统从一次性知识库升级为
> **持续运营的内容资产生产线**：追更（watchlist 增量水位线）→ 沉淀（转载计数等
> 内生热度信号）→ 提炼（insights 实体 + 版权角色硬约束）→ 趋势与学习路径
> （季度雷达 + 滚动版本化，SAP AI 重点）→ 自媒体状态管理（源文章/提炼稿双状态线 + 发布台账）。

| 新需求 | 设计文档 | 核心机制 |
|---|---|---|
| R11 持续追更 | docs/14 | authors/columns 订阅监视、last_seen 水位线增量、自适应频率 |
| R12 沉淀热文 | docs/14 | repost_count（去重副产品=免费热度信号）+ 你打星，popularity_score 榜单 |
| R13 知识提炼 | docs/15 | insights 五类型；inspiration/evidence 版权角色硬隔离；Tier 2 双审 |
| R14 趋势与路径 | docs/16 | trend_snapshots 时间序列 + 新词探测 + 季度报告 + 滚动版本化学习路径（SAP AI taxonomy 种子已按 2026-06 现状核实） |
| R15 状态管理 | docs/17 | documents.editorial_status 与 insights.status 双状态线正交；publications 发布台账；四个 Dataview 看板 |

schema.sql 含 v3.1 增量 DDL（已实测可执行）；路线图新增 Run 10–13；
新增 `prompts/COWORK_DISTILL_RUN.md` 周期提炼模板。

---

## v3.0 修了什么（一句话版）

> v2.1 方向正确但有 4 个会跑挂的技术缺陷（FTS5 中文检索失效、contentless 表无同步通路、
> column_id 与 column_items 矛盾、双 prompt 任务冲突）、3 个成本/流程盲区（每条线索双 LLM
> 审烧额度、FinalReview 独立性无实现机制、WeWe RSS 全文落盘使 summary_only 名存实亡），
> 以及物理文件双份存放、需求编号混乱、缺备份/takedown 等结构性隐患。v3 全部修复，方向零改动。

**完整问题清单与修复对照：`docs/00b_review_v2_to_v3.md`（先读这个）。**
schema.sql 已在 SQLite 3.45 实测：DDL 可执行、中文 trigram 检索通过、CHECK 约束生效。

### v3 核心变更速览
1. **schema.sql 重写**：FTS5 trigram + document_id 回查列；删 documents.column_id；
   补 UNIQUE/CHECK/索引；chunks 加 embedding 元数据；documents 支持 takedown。
2. **审核分三级**（docs/08）：Tier 0 规则审（零 LLM，100%）/ Tier 1 抽样单审 /
   Tier 2 双审只留高风险动作——LLM 调用从 400+/天 降到日常个位数。
3. **物理文件唯一**（docs/07）：正文只存 `10_articles/`，模块/专栏/作者全部 Dataview 虚拟门户，
   专栏篇序照样还原；附 slug 命名与 inbox 治理规则。
4. **采集规约补硬**（docs/05）：WeWe RSS 持久化前丢弃全文；两段式去重（阈值+人工归并）；
   源健康检查与降级链；验收用 fixture 不依赖外部源。
5. **独立审有实现机制**（docs/08/12）：FinalReview = 独立任务/会话 + 文件交接隔离。
6. **prompts 任务划分对齐**：CODEX 收窄为机械子集，消除与 COWORK 版的重叠冲突。
7. 新增：需求登记册（docs/13，R5 拆 R5a/R5b）、备份策略、takedown 流程、条款快照制、
   PIPL/APPI 提示、launchd 睡眠补跑幂等要求。

---
交付对象：**Cowork（主推动者+多智能体）**、Codex（GPT-5.3，机械执行）、Claude（设计评审）、本地 Agent

## v2.1 决策更新（Ryan，2026-06-10）

1. **阅读层锁定 A（Obsidian-first）**：不建 web 前端，语义问答走本地脚本。见 `docs/07` 第六节。
2. **版权阻塞兜底 = 人工导入工具**：单条、手动、人在环路的剪藏器（非爬虫）。新增 `docs/11`。
3. **模型分级**：Codex 最高模型(GPT-5.5)token 耗尽停摆；GPT-5.3 可用但只接机械活。见 `docs/12`。
4. **Cowork 为最优先推动者+主实施者**，开多智能体并行（Lead/Worker/SelfReview/FinalReview）；高智能深度思考全在 Cowork。见 `docs/12` + 新版 `prompts/COWORK_ORCHESTRATOR_v2.md` + 新增 `prompts/COWORK_BUILD_RUN01.md`。

---

## 这一版相对 ChatGPT v1.0 改了什么（一句话版）

> v1 把 SAPKB 当成一个**从零自建的孤岛 web 系统**；v2 把它重构成**嵌入你既有 sap-hub 生态的采集→知识资产层**，复用你已经跑起来的 `news/collect` 采集去重引擎、SAP_FUZHKB 的 Obsidian 工作流、launchd 调度，并补齐 v1 漏掉的 4 个需求（专栏/作者镜像、Obsidian-first 阅读体验、双环审核裁决、已购授权凭证）。

详细评审见 `docs/00_review_of_chatgpt_v1.md`。

---

## SAPKB 是什么（一句话）

把**知乎 / 微信公众号 / CSDN** 上与 SAP（重点 FICO）相关的公开文章、专栏、作者，
以及你**已购买授权**的付费内容，合规地收录进本地系统，去重、打标签、转成可检索可问答的知识库；
外部采集内容作为**参考层（raw）**，与你自己的权威配置库 SAP_FUZHKB **物理隔离、置信分层**，
全程由两个以上 AI Agent 自审 + 第三方审，自动增长、自动优化、自动审核。

---

## 三条不可逾越的红线（继承 v1，强化）

1. **不存任何平台账号密码、不模拟登录、不读浏览器 Cookie、不绕验证码/风控。**
2. **默认只入库元数据+摘要+链接；全文入库必须满足授权条件之一**（手动导入 / 已购授权 / 作者或平台明示允许 / 自有内容）。
3. **外部采集内容永不污染 SAP_FUZHKB 权威库，永不直接改写后冒充原创发布。**

合规与版权细节见 `docs/04_compliance_and_copyright_v2.md`，含**已购授权凭证留存**机制。

---

## 文件结构

```text
SAPKB_design_v2/
├── README.md                            ← 本文件
├── docs/
│   ├── 00_review_of_chatgpt_v1.md       ← 对 v1 的逐项评审：保留/改/为什么
│   ├── 01_product_blueprint_v2.md       ← 产品蓝图（嵌入 sap-hub 生态）
│   ├── 02_architecture_integration.md   ← 架构 + 与既有系统集成点
│   ├── 03_data_schema_v2.md             ← 数据模型 v2（专栏/作者/授权凭证）
│   ├── 04_compliance_and_copyright_v2.md← 合规+版权+已购授权凭证
│   ├── 05_acquisition_channels.md       ← 三平台现实采集通道（复用既有工具栈）
│   ├── 06_skill_catalog_v2.md           ← Skill/工具目录（对齐既有命名）
│   ├── 07_obsidian_kb_layout.md         ← SAPKB 在 Obsidian 的布局/专栏镜像/阅读体验
│   ├── 08_dual_review_protocol.md       ← 双环自审 + 三方审裁决机制
│   ├── 09_local_llm_rag_plan_v2.md      ← 本地模型/RAG（Mac mini 现实）
│   ├── 10_roadmap_and_milestones.md     ← 路线图（对齐既有 Run/Phase 节奏）
│   ├── 00b_review_v2_to_v3.md           ← 【v3】对 v2.1 的评审与修复对照（先读）
│   ├── 11_manual_import_tool.md         ← 【v2.1】人工导入工具（版权阻塞兜底）
│   ├── 12_orchestration_and_model_routing.md ← 【v2.1/v3】Cowork主导·分级审核
│   ├── 13_requirements_register.md      ← 【v3】需求登记册（唯一编号源，含 R11–R15）
│   ├── 14_continuous_acquisition.md     ← 【v3.1】持续追更 + 热度沉淀（R11/R12）
│   ├── 15_distillation_pipeline.md      ← 【v3.1】知识提炼管线（R13）
│   ├── 16_trend_and_learning_path.md    ← 【v3.1】趋势雷达 + 学习路径（R14·SAP AI）
│   └── 17_editorial_status_management.md← 【v3.1】自媒体状态管理（R15）
├── prompts/
│   ├── COWORK_ORCHESTRATOR_v2.md        ← 【v2.1改】Cowork 主推动者+多智能体
│   ├── COWORK_BUILD_RUN01.md            ← 【v2.1新】Cowork 主导第一轮构建
│   ├── CODEX_BUILD_RUN01.md             ← Codex 机械子任务（被 Cowork 下派）
│   └── REVIEWER_AGENT_PROMPT.md         ← 独立第三方审（可由 Cowork-FinalReview 担任）
├── configs/
│   ├── schema.sql                       ← 建表 DDL v2（可直接跑）
│   ├── sapkb_taxonomy.yaml              ← SAP 分类法（FICO 深度扩展）
│   ├── acquisition_sources.yaml         ← 采集源配置（对齐 sources.yaml）
│   └── routing_policy_v2.yaml           ← 路由/合规策略 v2（加 license_purchased）
└── diagrams/
    └── sapkb_dataflow.mmd               ← 数据流图（含双审环 + 置信分层）
```

## 怎么用这个包（推荐顺序）

1. 先读 `docs/00b_review_v2_to_v3.md`（v3 修了什么），再读 `docs/00_review_of_chatgpt_v1.md`。
2. 读 `docs/02_architecture_integration.md` 的“集成点”一节，确认 SAPKB 挂在你哪个 Project / vault。
3. 把 `prompts/COWORK_ORCHESTRATOR_v2.md` 交给 Cowork 当主推动者（开多智能体）。
4. 把 `prompts/COWORK_BUILD_RUN01.md` 交给 Cowork 跑第一轮；机械子任务由 Cowork 下派 Codex(5.3)（见 `prompts/CODEX_BUILD_RUN01.md`）。
5. 每轮产出 → Cowork-SelfReview 自审 → Cowork-FinalReview 独立审（机制见 `docs/08`、`docs/12`）→ 落盘裁决 → 下一轮。

## 已决的架构选择（v2.1）

阅读层走 **A（Obsidian-first）**——你已重度使用、零学习成本，语义问答用本地脚本而非另建 web 前端。
详见 `docs/07` 第六节。将来知识块过万或有对外/多端需求，再起一轮加 web 检索层。
