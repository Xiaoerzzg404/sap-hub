# Project 4 · SAP 项目日语培训 — 项目地图（PROJECT_MAP）

> 本文件是整个 project 的「导航总图」。任何人（或 AI agent）进来先读这一页，
> 就知道东西在哪、哪套是真相源、课程和自媒体分别从哪里开工。
>
> - 维护者：Ryan（小耳）· 东京 SAP FICO 顾问 15+ 年
> - 项目定位：**创造 / 更新 / 迭代 / 优化「SAP 项目日语培训」的课程内容 + 自媒体内容**
> - 治理规则见 [`AGENT_GUARDRAILS.md`](AGENT_GUARDRAILS.md)；项目愿景见 [`_instructions.md`](_instructions.md)
> - 工作指南（怎么干活）见 [`CLAUDE.md`](CLAUDE.md)
> - last_updated: 2026-06-10

---

## 0. 一句话定位

这不是普通日语课，是**「中国 SAP 顾问进入日本项目的语言战斗力训练营」**。
学员已懂本模块 SAP，缺的是日本项目现场的表达套路。本 project 同时产出两类资产：
**(A) 培训课程内容**、**(B) 自媒体内容**（公众号 / 小红书 / 视频号 / B 站）。

---

## 1. 目录速查（每个一级目录是什么）

| 目录 | 是什么 | 角色 |
|---|---|---|
| `SAP-Japan-Training-Vault/` | **Obsidian 知识库**：43 课逐字稿 + 150 张原子卡（CON/TAO/KEY/ANT/SCN）+ SAP 项目日语 + 中国人专项辞典 + 讲师/学员工具包 + **12_AI养料 自媒体素材** | SAP 项目日语**中级班**课程设计（打磨迭代中）；自媒体爆款主力素材源（只读） |
| `sap_jp_training_course/` | **V4 24 课「讲师聚焦版」成品包**（每课 10–12 个集中文件）+ V4 提示词 / 模板 / 批次质量报告 | SAP 项目日语**初级班**课程设计；训练平台 sap-jp.training 基于它 |
| `SAP-JP-Media-Vault/` | **自媒体创作知识库**（新建·独立）：内容战略 + 选题库 + 钩子/关键词/金句库 + 模板 + 成稿 + 素材源映射 | **本库的迭代/追加都在这里发生**；只读引用上面两个课程库，绝不改它们 |
| `SAP日语培训/` | **课程「生产工厂」**：提示词 + 模板 + 风格手册 + 交付标准 + `output/`（术语表 / 句型库 / 讲师手册 / 学生讲义 / RolePlay / 质量审查） | 课程生产工具链（不是真相源，是产线） |
| `knowledge/` | v3 架构活文档：`backbone/`（型）+ `case-packs/`（模块包，FICO 为首）+ `glossary/` + `units/` | 结构化资产层（部分填充） |
| `web/` | **Next.js 学员平台**（已到 PR #1 / Vercel Preview，卡在 CDN 与生产环境配置）| 产品交付端（学员/讲师/admin） |
| `inbox/` | agent 之间的交接（handoff-*）与待你决策（need-input-*） | 协作总线 |
| `state/` | 项目进度 JSON（`sap_jp_training_course.json` 是主 state）| 进度真相源 |
| `docs/` | 审计报告、对比文档、专题说明 | 专题文档 |
| `exports/` | 对外成品导出（如 24 课提纲 xlsx）| 交付物归档 |
| `logs/` | 各类执行 / 审计 log | 运行记录 |

---

## 2. 两套课程体系的关系（Ryan 2026-06-10 定）

| 维度 | `sap_jp_training_course` V4 24 课 | `SAP-Japan-Training-Vault` 43 课 |
|---|---|---|
| **定位** | **初级班**课程设计（训练平台 sap-jp.training 基于它）| **中级班**课程设计（打磨迭代中）|
| 课数 | 24（Lesson 01–24）| 43（S01–S43）|
| 组织 | 4 主题（文化礼仪 / 信息化 / 市场 / 项目实战 / 职场口语）| 8 支柱 P1–P8 + 5 课型 + 7 金标准锚点 |
| 侧重 | 文化 + 市场 + 模块 + 项目阶段日语，广 | 语言**战斗力**：软拒绝 / 危机政治 / 证据化 / 根回し，深 |
| 卡片体系 | 无（成品包形态）| 有（150 张双链原子卡）|
| 网站对接 | **是**（`web/data/lessons.json` = 24 课）| 否 |
| 自媒体素材 | 偏认知/广度 | `12_AI养料` 43 个素材点 + 150 卡，**爆款主力** |

→ 两者**都是 SAP 项目日语的知识库（只读参考源）**。
🚫 **硬规则**：后续迭代/追加的内容**不写入这两个课程库**，一律落到新建的
`SAP-JP-Media-Vault/`（自媒体）或其它新库；需要它们的内容时用「引用 + 溯源」，不搬运不覆盖。

（历史对比文档：[`docs/课程真相源对比_Vault43_vs_V4-24_20260610.md`](docs/课程真相源对比_Vault43_vs_V4-24_20260610.md)，
现已按"初级/中级班 + 独立自媒体库"口径取代其中的"二选一真相源"建议。）

---

## 3. 我要做某件事，从哪开工？

### A. 课程内容（创造 / 更新 / 迭代）

| 想做的事 | 入口 |
|---|---|
| 看 43 课全图 / 卡片体系 | `SAP-Japan-Training-Vault/01_课程主索引_MOC/MOC_全课程导航.md` |
| 看 24 课总览 / 主题映射 | `sap_jp_training_course/03_24课课程总览表_V4.md` |
| 新增/重写一课（V4 产线）| `sap_jp_training_course/prompts_v4/single_lessons/` + `templates_v4/` |
| 改课程「生产规则」（风格/交付标准）| `SAP日语培训/03_风格手册/`、`SAP日语培训/04_交付标准/` |
| 加一张知识卡（句型/反模式/场景）| `SAP-Japan-Training-Vault/0{3,4,5,6,7}_*卡_*/` |
| 术语 / 句型总表 | `SAP日语培训/output/04_术语表/`、`05_句型库/` |
| 模块 case-pack（FICO/MM/SD…）| `knowledge/case-packs/`（模板 `_PACK-TEMPLATE.md`）|

### B. 自媒体内容（公众号 / 小红书 / 视频号 / B 站）

| 想做的事 | 入口 |
|---|---|
| 取素材源（按支柱分组的爆款选题）| `SAP-Japan-Training-Vault/12_AI养料_自媒体素材/_自媒体素材汇总.md` |
| 每课专项 AI 养料（43 个素材点）| 各课逐字稿第 6 节「AI 养料」 |
| 自媒体产线（待建）| 见 `CLAUDE.md` §自媒体工作流（本次为之留好挂载点）|

> 注：本 project 只产**教学内容 + 自媒体内容**。课程定价/产品线在 6 号 project，
> 招生文案在 3 号 project，学员/反馈/案例在 5 号 project（见 `_instructions.md`）。

### C. 网站 A/B 双版本与 Insight Desk 接入

| 想做的事 | 入口 |
|---|---|
| 了解 A/B 双版本背景、状态、功能差异、接手建议 | `docs/sap-jp-training-site-a-b-handoff_20260610.md` |
| 看本轮 A/B 接入 Insight Desk 的执行交接 | `inbox/handoff-insight-desk-training-sites-20260610.md` |
| 看 A 当前进度真相源 | `state/sap_jp_training_course.json` 的 `latest_insight_desk_integration` |
| 看 A 的代码与运行面 | `web/` |
| 看 B 的本地备份样本 | `http://127.0.0.1:7788/sap-jp-training-public-backup/index.html` |

---

## 4. 协作纪律（最低限度，详见 AGENT_GUARDRAILS.md）

1. 动手前先读：`AGENTS.md`（sap-hub 根）→ 本 `PROJECT_MAP.md` → `AGENT_GUARDRAILS.md` → `_instructions.md` → `state/sap_jp_training_course.json` → `inbox/` 最新相关交接。
2. **最小改动**：改内容别顺手重构代码，改代码别顺手改课程内容。
3. 说明类 `.md` 用中文；课程日文例句/对话/口播保持日文。
4. SAP 事实（事务码/配置/版本）须核实，否则标 `Need Confirmation`；不编造客户/引语/数字。
5. 有意义的工作做完→更新 state + 写 `inbox/` handoff。
6. 不确定就停手写 `inbox/need-input-<topic>-<date>.md`，不要猜。

---

## 5. 当前未决 / 阻塞（截至 2026-06-10）

- **课程真相源未拍板**（Vault 43 vs V4 24）— 待 Ryan 看对比文档后决定。
- **自媒体产线未建** — 已有素材源与选题，缺「素材→成稿→各平台」的标准流程。
- **网站部署阻塞**（历史遗留，来自 state）：course-audio CDN base URL、Vercel 环境变量
  `NEXT_PUBLIC_COURSE_AUDIO_BASE_URL` / `REGISTRATION_INVITE_CODE` 未配置；PR #1 仍是 draft。
- **A/B 双版本已在本机 Insight Desk 接入，但仍未发生公网替换** — A 仍是本地主开发线，B 仍是公网历史版与本地备份。
- **MiniMax TTS 重跑**卡在额度（589/1543 待补，state `latest_tts_rerun`）。
