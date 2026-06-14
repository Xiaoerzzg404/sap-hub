# 00｜对 ChatGPT v1.0 的评审：保留什么 / 改什么 / 为什么

> 评审对象：`sap_local_knowledge_hub_design`（ChatGPT Pro，v1.0，2026-06-10，约 1900 行）
> 评审人：Claude
> 结论：**骨架可用，直接重写为孤岛系统会浪费你已有的基础设施。** 保留其合规与数据模型资产，重构集成方式，补齐 4 个被忽略的需求。

---

## 一、原样保留（v1 做对了的）

| # | v1 资产 | 为什么保留 |
|---|---|---|
| 1 | 三条合规红线（不存密码 / 不绕验证码 / 不批量搬全文） | 写得克制、可执行，是整个系统的法律护城河 |
| 2 | 双状态枚举 `content_status` + `rights_status` | 把“内容处理到哪一步”与“能不能用”解耦，设计干净 |
| 3 | `documents / contents / tags / chunks / audit_logs` 五表 | 数据模型合理，v2 在此基础上加表而非推翻 |
| 4 | SAP 实体识别（模块/事务码/表/字段/配置路径/业务流程） | 抓住了 SAP 内容区别于普通文章的核心特征 |
| 5 | “RAG 优先于从零训大模型”的判断 | 对。SAP 知识更新快、项目知识私密、RAG 可审计——v2 完全认同 |
| 6 | Skill 分层（Discovery/Import/Process/Knowledge/Audit/Agent） | 分层清晰，v2 沿用并对齐你既有 skill 命名风格 |
| 7 | 答案强制引用本地来源 + 冲突/过期提示 | RAG 问答的正确姿势 |

---

## 二、必须改（v1 的根本短板）

### 短板 A：完全不知道你已有 sap-hub 生态 —— 这是最严重的

v1 假设你从一张白纸开始，于是设计了：要新建 React/Next.js 前端、要重写 SimHash 去重、要新建一套 SQLite、要新建 Agent 记忆目录。**而你已经有：**

| 你已有的 | v1 重复造的轮子 | v2 的处理 |
|---|---|---|
| `~/news/collect/` 统一数据层 + SQLite 去重引擎 + JSONL schema + `sources.yaml` | 重写去重、重建数据层 | **复用**，SAPKB 采集走同一条管线，去重引擎扩展而非重写 |
| WeWe RSS（公众号）/ RSSHub（知乎）/ Playwright 持久会话（小红书）/ 手动（视频号） | 泛泛设计“discovery skill” | **对接既有通道**，见 `05_acquisition_channels.md` |
| SAP_FUZHKB Obsidian vault（67 流程库 + 15_Configuration v3.1） | 没提，可能与之冲突 | **物理隔离**：外部采集进 `SAP_EXTKB`，永不污染 FUZHKB |
| launchd 已占 19:00/20:30/21:30/22:00 | 说“定期发现”，没给档期 | **避让**，SAPKB 采集建议 06:30 或 12:30，见 `02` |
| AGENTS.md 宪法 + 6 个 Project + Claude设计/ChatGPT验证/Codex执行 的既有分工 | 自定义一套新角色名 | **沿用宪法与既有角色**，见 `prompts/COWORK_ORCHESTRATOR_v2.md` |
| Obsidian 重度使用习惯（306 文件） | 要再造一个 web 阅读前端 | **Obsidian-first 阅读层**，见 `07` |

> 一句话：v1 是“再建一个 sap-hub”，v2 是“给 sap-hub 加一个采集知识库模块”。

### 短板 B：漏了需求 8（为大专栏/作者建“同样的专栏”）

v1 的数据模型里**没有 `columns`（专栏）和 `authors`（作者）这两个一等实体**，因此无法“为内容多的专栏/作者建立同样的专栏”。
v2 新增 `authors`、`columns`、`column_items` 三张表，并在 Obsidian 里做**专栏镜像**（按作者/专栏建文件夹，保留原专栏的篇序与结构）。见 `03` 和 `07`。

### 短板 C：漏了需求 9 的最佳解（高 UX 阅读体验）

v1 给的是“自建 React 前端”。但你重度用 Obsidian，自建前端意味着**两套阅读环境割裂**，UX 反而更差。
v2 把阅读体验放在 Obsidian（双链、Dataview、Graph、全文搜索都现成），web 只做轻量检索 API。见 `07`。

### 短板 D：漏了需求 10 的显式机制（双 AI 自审 + 三方审）

v1 有 Compliance Reviewer / SAP Expert Agent 等角色，但**没有“自审→第三方审→裁决落盘”的闭环 gate**，也没说审核分歧怎么裁。
v2 定义显式的 **two-pass review protocol**：执行 Agent 自审（self-check）→ 独立第三方 Agent 复审（cross-check）→ 分歧进裁决表 `review_verdicts`。见 `08`。

### 短板 E：漏了“已购授权”这一档（你明确说会买版权）

v1 的 `rights_status` 枚举到 `fulltext_allowed` 为止，**没有“已付费购买授权 + 凭证留存”**。
对一个真要商用的自媒体人，出事时要能自证“我买了”。v2 新增 `rights_status: license_purchased` + `licenses` 表（许可证 ID / 发票 / 购买日 / 许可范围 / 到期日）。见 `03`、`04`。

---

## 三、可商榷（v1 的判断我部分保留、部分调整）

| v1 主张 | v2 调整 | 理由 |
|---|---|---|
| 技术栈用 PostgreSQL + React + Qdrant + Docker Compose 起步 | MVP 用 **SQLite + Obsidian + Chroma/LanceDB + Ollama**，先不上 Docker | Mac mini 单机，重栈是负担；先轻后重 |
| “本地大模型”当成中长期目标泛泛带过 | 明确**三阶段定义**：RAG → 术语/评测增强 → 才考虑 LoRA，并标注 Mac 硬件现实 | 你需要能落地的判断，而非愿景 |
| Growth Agent 自动发现主题 | 复用你**干货/八卦流水线**已验证的 backlog harvester + 状态队列模式 | 别再发明一套增长机制，你已经有跑通的 |

---

## 四、评审的一句话总结

ChatGPT 给了一套**正确但悬空**的设计——合规对、数据模型对、方向对，但它不知道你已经有半个系统跑在 Mac mini 上。
v2 做的事，就是**把这套设计接地到你的现实**：复用能复用的、隔离该隔离的、补齐缺的那 5 块。
