# 10｜路线图与里程碑

> 沿用你既有的 Run 化迭代节奏（Codex 执行一轮 → Cowork 审 → 第三方审 → 下一轮）。
> 原则：先做能跑的最小采集→入库→检索闭环，再加专栏镜像、授权、双审、自动增长、本地模型。

> **v2.1 说明**：下表「Codex 做」一栏重解读为 **Cowork-Lead 主导、机械子任务下派 Codex(5.3)**；每轮产出过 Cowork 自审 + 最终审（docs/12）。阅读层已锁 A，Run 04 落地即写 Obsidian md，不建 web 前端。

## Run 节奏总览

| Run | Codex 做 | 审核重点 | 里程碑 |
|---|---|---|---|
| 00 | 在 `~/sap-hub/apps/sapkb/` 初始化 + 跑 schema.sql + 建 SAP_EXTKB vault 骨架 | 目录/架构/vault 隔离 | — |
| 01 | 采集对接 collect + Compliance Gate + 入 documents | 合规边界、复用去重 | **M1 采集→入库闭环** |
| 02 | SAP 实体识别 + 摘要 + 自动标签 + embedding 去重 | SAP 分类准确性 | **M2 自动加工** |
| 03 | 混合检索 + RAG 问答（带引用、置信层） | 引用正确、无幻觉 | **M3 本地问答** |
| 04 | 写入 SAP_EXTKB（frontmatter + 模块归档） | Obsidian 结构/UX | **M4 Obsidian 落地** |
| 05 | authors/columns + 专栏镜像（保篇序） | 镜像正确、篇序还原 | **M5 专栏镜像（需求8）** |
| 06 | licenses 登记 + rights 流转 | 授权凭证、scope 管控 | **M6 已购授权（需求5版权）** |
| 07 | 双审 gate + review_verdicts 落盘 | 独立性、裁决可回溯 | **M7 双审（需求10）** |
| 08 | growth.harvest_backlog 自动增长 + 晨间 launchd | 自动化、避让既有档期 | **M8 自动增长** |
| 09 | 本地模型接口 + SAP 评测集 | 断网可用、评测达标 | **M9 本地模型增强** |
| 10 | watchlist 增量追更 + 热度信号 + 榜单门户 | 幂等、水位线、自适应频率 | **M10 持续采集（R11/R12）** |
| 11 | editorial 状态 + publications + 四看板 | 双状态线正交、对账不静默覆盖 | **M11 自媒体状态（R15）** |
| 12 | 提炼管线（insights + 版权角色约束 + 双审） | inspiration/evidence 硬隔离 | **M12 知识提炼（R13）** |
| 13 | 趋势快照 + 新词探测 + 首版趋势报告/学习路径 | 信号有据、路径含修订判据 | **M13 趋势与路径（R14）** |

## 各 Run 验收（关键几个）

**Run 01 验收**
- `--source fixture_csdn` 跑通全链路 ≥20 条 `metadata_only`，有来源/作者/时间
  （v3：验收用 fixture，不被外部源可用性卡死；真实源跑通单独记录为运维项）。
- 重复执行 harvest 幂等（不重复入库，launchd 睡眠补跑场景）。
- 入库内容不含全文 body（grep 验证，docs/05 v3 规约）。
- 去重生效（同文转载被归并），且**确认代码 import 了 collect 的去重模块、没新写**。
- 没有任何登录/cookie/绕验证码代码。

**Run 03 验收**
- 问“F110 自动付款需要哪些主数据和配置”，答案从本地库出，每条事实带来源链接，权威/参考分层标注。

**Run 05 验收（需求 8）**
- 某作者收录达阈值后，自动在 `02_columns/<作者>/<专栏>/` 生成镜像，篇序与原专栏一致，门户 index.md 用 Dataview 列出并标“已收 N/M 篇”。

**Run 07 验收（需求 10）**
- 一条采集条目经自审 pass、第三方审 fail，系统正确 escalate_to_human 并把分歧落到 review_verdicts。

**Run 12 验收（R13）**
- 用 metadata_only 源伪装 evidence 提交一个 insight → 合规审必须 fail（角色约束生效）。
- 一个 growth_article 走完 draft→published，全部源文档 editorial_status 自动变 distilled。

**Run 13 验收（R14）**
- trend_snapshots 物化出 ≥2 个期间可比的标签序列；一个 taxonomy 外新词被探测进 term_candidates。
- 学习路径 v1 含四要素（方向+依据 / 内容 / FICO 迁移 / 修订判据），缺一不过审。

## 第一轮 Codex 最小任务（即 prompts/CODEX_BUILD_RUN01.md）
只要求：跑通 schema → 对接 collect 取一批 SAP 线索 → 过 Compliance Gate → 入 documents → 基础关键词标签（FI/CO/MM/SD/PP）→ 一个 CLI 查询。**不碰前端、不碰全文、不碰登录。**

## 风险与缓解

| 风险 | 缓解 |
|---|---|
| Codex 图省事新写去重/绕过 collect | prompt 硬约束 + Run01 审核必查 import |
| 采集越界抓全文 | Compliance Gate 默认 metadata_only，全文需显式授权 |
| 采集库污染权威库 | vault 物理隔离 + Codex 只给 SAP_EXTKB 写权限 |
| 双审走过场 | 第三方审输入不含自审结论，强制独立 |
| 一上来追求本地大模型 | 路线图把 LoRA 放到 Run 09 之后，且设硬门槛 |
| 每条线索过双 LLM 审烧穿额度 | v3 分级审核：Tier 0 规则审全覆盖，双审只留高风险动作 |
| RSSHub 路由失效卡死流程 | 源健康检查 + 降级链（搜索引擎线索→剪藏）+ fixture 验收 |
