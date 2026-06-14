# 00b｜对 v2.1 的评审：v3.0 修了什么 / 为什么

> 评审对象：SAPKB_design_v2.1（2026-06-10）
> 评审人：Claude
> 结论：**v2.1 的方向（嵌入 sap-hub、置信分层、合规分级）正确，但存在 4 个会直接跑挂的技术缺陷、
> 3 个会烧穿 AI 额度的成本盲区、若干流程矛盾。v3.0 全部修复，方向不变。**

---

## 一、P0 — 不修就跑不起来 / 跑错

### P0-1 FTS5 中文检索基本失效（schema.sql）

v2 的 `tokenize='unicode61'` 不分词中文：连续中文文本会被切成超长 token，
中文标题/摘要的全文搜索几乎查不到任何东西——对一个中文内容知识库是致命的。

**v3 修复**：`tokenize='trigram'`（SQLite ≥3.34 内置，中文可用、零依赖）。
短词（≤2 字符，如模块名 "AP"）不靠 FTS，走 `document_tags` 精确检索——本来就该这么查。

### P0-2 FTS5 contentless 表没有同步与回查通路（schema.sql）

v2 用 `content=''`（contentless）：不能 UPDATE、查询拿不到原文、且与 `documents`（TEXT 主键）
之间**没有任何映射列**——查到了 rowid 也对不回文档。

**v3 修复**：改普通 FTS5 表 + `document_id` UNINDEXED 列；几万篇规模的空间冗余可忽略，
换来可更新、可删除、可回查。同步责任写进 ingest 规约（入库/更新/删除三处必须同步 FTS）。

### P0-3 `documents.column_id` 与 `column_items` 互相矛盾（schema.sql / docs/03）

一篇文章可进多个专栏（知乎常见），v2 同时存了单值外键和多对多关系表，必然不同步。

**v3 修复**：删掉 `documents.column_id`，专栏关系唯一真相 = `column_items`。

### P0-4 双 prompt 任务重叠，照做必冲突（prompts/）

`CODEX_BUILD_RUN01` 让 Codex 做全量 8 项（含 compliance_gate / dedup / tag），
`COWORK_BUILD_RUN01` 又把同样 4 项划给 Cowork-Worker。两份都执行 = 同一文件两套实现。

**v3 修复**：CODEX prompt 收窄为纯机械子集（目录初始化 / schema / harvest 骨架 / CLI 骨架 /
模板与测试脚手架），与 COWORK prompt 的分工表逐项对齐，并写明"以 COWORK 版分派为准"。

---

## 二、P1 — 不修就烧钱 / 流程自相矛盾

### P1-1 每条线索都过双 LLM 审 = 成本爆炸（docs/08）

v2 把 self-check + cross-check 套在所有产出上。`max_per_run=200` 意味着
最多 **400+ 次 LLM 调用/天**只为审元数据条目——而元数据合规审本质是字段校验，不需要 LLM。

**v3 修复**：审核分三级——
- **Tier 0 规则审（代码，零 LLM，100% 覆盖）**：必填字段、rights 一致性、禁词扫描、evidence 文件存在。
- **Tier 1 LLM 单审（抽样）**：批量低风险产出（标签/摘要）抽 10% + 全部置信升级条目。
- **Tier 2 LLM 双审（self + cross，100%）**：只对高风险动作——全文升级、license 登记、
  进选题池、Codex/Worker 代码、专栏镜像首建、RAG 答案（可配置）。
需求 10 的"双 AI 审"语义保留在 Tier 2，不稀释，但不再为元数据烧额度。

### P1-2 "FinalReview 看不到自审结论"没有实现机制（docs/12）

Cowork 同一会话内多 agent 共享上下文是常态，纸面上的"输入不含自审结论"没有约束力。

**v3 修复**：写明物理隔离机制——FinalReview 必须是**独立任务/独立会话**，
输入只有两个文件路径（原始产物 + checklist）；SelfReview 结论写入 `review/self/`，
FinalReview 的工作目录只挂载 `review/inbox/`。由 ChatGPT 担任时通过导出文件交接。

### P1-3 WeWe RSS 实际输出全文，"默认只入库摘要"会变空话（docs/05）

WeWe RSS 抓的是全文 RSS。若 ingest 端不处理，全文已经落盘，summary_only 名存实亡。

**v3 修复**：ingest 端强制规约——持久化前丢弃 body，只落标题/链接/作者/时间 + 摘要
（摘要 = RSS description 截断或 AI 生成）；全文字段不写入任何持久层。验收加 grep 检查。

### P1-4 审核 gate 卡在哪一步，三处文档说法不一（docs/01 / 08 / diagrams）

数据流图画的是"双审通过才入 KB"，工作流 A 又是"先入库再审"。

**v3 修复**：明确状态机——元数据入库**不需要** LLM 审（只过 Tier 0）；
LLM 审挂在三个**状态转移**上：`→fulltext_saved`（升级全文）、`→embedded`（进向量库/RAG 可见）、
`→选题池`。数据流图同步改。

### P1-5 去重时点与对象没说清（docs/02 / 05）

"embedding 去重"画在 SAP 处理层之前，但那时只有标题+摘要。

**v3 修复**：两段式去重——入库前做 URL 规范化 + 标题 SimHash（复用 collect）；
embedding 去重在摘要生成后、针对"标题+摘要"向量做，阈值与误判处理（疑似转载→标记不归并，
进 needs_review）写进 routing_policy。

---

## 三、P2 — 结构性隐患

### P2-1 同一文章两份物理文件，去重系统自己制造重复（docs/07）

v2 让文章按模块放 `01_by_module/`，专栏镜像又在 `02_columns/` 生成 `NN_title.md`——
同一文档两份实体文件，改一处漏一处。

**v3 修复**：**物理文件唯一**，统一落 `10_articles/`（slug 命名）；
`01_by_module`、`02_columns`、`03_authors` 全部变成 **Dataview 虚拟门户**（只有 index.md，
按 frontmatter 的 modules / column / seq_in_column 渲染，专栏篇序照样还原）。
附 slug 规则（中文标题含 `/ : ?` 等非法字符必须清洗）。

### P2-2 需求编号引用混乱

"需求 5"在不同文档里既指"本地大模型"又指"已购版权"。

**v3 修复**：新增 `docs/13_requirements_register.md` 作为唯一需求登记册，
版权拆为"需求 5b"，全包统一引用。

### P2-3 缺备份 / takedown / 一致性三件套

- 备份：SQLite + 向量库 + vault 三处状态无备份策略。v3：SQLite 用 `.backup` 每日快照，
  vault 走 git（或 Time Machine），**向量库定位为派生数据，可重建、不备份**。
- 作者要求下架（takedown）：v3 在 documents 加 `takedown` 字段 + 删除传播流程
  （DB → FTS → 向量库 → vault → 备份保留期说明）。
- chunk 与向量库一致性：chunks 表加 `embedding_model / vector_id`，换模型可识别需重嵌的块。

### P2-4 合规文档把平台条款编号写死（docs/04）

"CSDN 条款 5.2 条（已核实 2026-06）"——条款随时改版，写死编号会过时且无法自证当时核实过。

**v3 修复**：条款核实改为**快照机制**——核实时把条款页面存档到 `_sources/tos_snapshots/`
（与 FUZHKB 的 `_sources/` 证据模式一致），文档只引用快照文件，不引用条款编号。
另补 PIPL / APPI 个人信息处理提示（作者名、主页 URL 属个人信息，自用与对外两条线）。

### P2-5 验收依赖外部源可用性（prompts / docs/10）

RSSHub 的 CSDN 路由可用性不稳定（需在实施时实测）。验收"采集 ≥20 条"若路由恰好挂掉就永远过不了。

**v3 修复**：验收允许 fixture 路径（`--source fixture_csdn` 读本地样本 JSONL），
真实源可用性单独作为运维项：健康检查 + 失效告警 + 降级到手动/剪藏通道。

### P2-6 其他小修

- `schema.sql`：补 UNIQUE（authors 平台+UID、documents.source_url）、CHECK 枚举约束、
  canonical_document_id 索引、review_verdicts 拆 result/notes 两列。
- launchd 06:30 档：Mac 睡眠时 StartCalendarInterval 会在唤醒后补跑一次，文档写明
  幂等要求（重复跑不重复入库）。
- 模型选型（qwen / bge-m3 等）改为"实施时以 Ollama 当期可用模型实测选型"，不在设计稿写死。
- inbox 治理：00_inbox 条目 7 天未 triage 自动进 needs_review 仪表盘，防垃圾场化。

---

## 四、一句话总结

v2.1 把"该不该建、建在哪、红线是什么"想清楚了；v3.0 把"建出来能不能跑、跑起来烧不烧钱、
出错了怎么回溯"补齐了。方向零改动，全部是工程与成本层的加固。
