# 02｜架构与既有系统集成

## 一、总体架构（标注复用 vs 新建）

```text
┌─────────────────────────────────────────────────────────────┐
│ 入口层                                                         │
│ 浏览器剪藏 · CLI · 既有采集通道 · Obsidian 内手动              │
│ (复用 news/collect 入口 + 新增剪藏)                            │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│ Compliance Gate （新建·薄层）                                  │
│ robots / rights 判定 / import_mode 决策 / 授权凭证校验          │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│ 采集与去重管线  （★复用 ~/news/collect 的 SQLite 去重引擎★）    │
│ 规范化 → 去重(URL/SimHash/Embedding) → 落 JSONL/SQLite         │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│ SAP 处理层  （新建·SAP 专属）                                  │
│ 正文清洗 → SAP 实体识别 → 自动摘要 → 自动标签 → 分块            │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│ 存储层                                                         │
│ SQLite(元数据+FTS5) · Chroma/LanceDB(向量) · 文件 · Obsidian   │
│ vault: SAP_EXTKB （新建，与 SAP_FUZHKB 物理隔离）              │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│ AI 层  Ollama(本地LLM) · 本地embedding · reranker · RAG        │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│ Agent 层  Cowork(编排+自审) → 第三方Reviewer(三方审) → 裁决落盘 │
│ (沿用 AGENTS.md 宪法与既有 Claude/ChatGPT/Codex 分工)          │
└─────────────────────────────────────────────────────────────┘
```

## 二、集成点（v2 的核心，v1 完全没有）

### 集成点 1：复用 `~/news/collect/` 采集去重层

你已有：统一数据层、SQLite 去重引擎、规范 JSONL schema、CLI 入口、`sources.yaml`。

- SAPKB **不新建**采集与去重，而是：
  - 在 `sources.yaml` 里新增一个 `sapkb` 命名空间的源组（CSDN/知乎 SAP 专栏、SAP 公众号）。
  - 去重引擎扩展：在既有 URL/标题/SimHash 去重之上，加一条 **embedding 去重**（SAP 文章大量转载，文本去重不够）。
  - 采集产物落到既有 JSONL，再由 SAPKB 的 SAP 处理层接管。
- **Codex 任务约束**：禁止新写一套去重；必须 import 既有去重模块。

### 集成点 2：vault 隔离 —— 新建 `SAP_EXTKB`，不动 `SAP_FUZHKB`

```text
/Users/openclawxiaoer/sap-hub/vaults/
├── SAP_FUZHKB/        ← 你的权威库（只读守护，禁止采集写入）
└── SAP_EXTKB/         ← 新建：外部采集知识库（SAPKB 的 Obsidian 落地）
```

- 两个 vault 物理分离，Codex/采集进程**只有 SAP_EXTKB 写权限**。
- 跨库引用只允许：SAP_EXTKB 的笔记可以 `[[wikilink]]` 指向 FUZHKB（只读引用），反之禁止。

### 集成点 3：launchd 调度避让

你已占：19:00 早报 / 20:30 AI / 21:30 干货 / 22:00 八卦。

- SAPKB 采集建议 **06:30 JST**（晨间，不与晚间内容流水线争资源）或 **12:30 JST**。
- 新增 launchd label 建议：`com.ryan.sapkb.harvest-at-0630`。
- 与既有 19:00 协调员同构：先 trigger 检查状态，再兜底执行。

### 集成点 4：沿用 AGENTS.md 宪法与既有 AI 分工

- 不发明新角色名。继续 **Claude=设计/评审、ChatGPT=独立交叉验证、Codex=文件执行**。
- SAPKB 的“双审 gate”里，第三方审角色可由 **Cowork 的第二个 Agent 实例** 或 **ChatGPT** 担任（满足需求 10 “可同品牌多 Agent”）。

### 集成点 5：与既有内容流水线对接（下游消费 SAPKB）

- 你的 `SAP干货流水线` / `SAP八卦流水线` 已有 backlog harvester + 状态队列模式。
- SAPKB 成为干货流水线的**一个新的 inventory 源**：采集库里高质量、已授权、已去重的条目，可进入干货选题池。
- 注意置信层：进入选题池的内容必须经改写、标来源，不直接搬。

## 三、推荐技术栈（Mac mini 单机现实，先轻后重）

| 层 | MVP（先用这个） | 进阶（量大再换） |
|---|---|---|
| 元数据库 | SQLite + FTS5（复用 collect） | PostgreSQL |
| 向量库 | Chroma 或 LanceDB（本地、零运维） | Qdrant |
| 后端 | Python（脚本/FastAPI 单文件） | FastAPI 完整服务 |
| 阅读层 | **Obsidian（SAP_EXTKB vault）** | + 轻量检索 web（可选） |
| 解析 | trafilatura / PyMuPDF / python-docx / markitdown | 同 |
| OCR | PaddleOCR（中文好）/ Tesseract | 同 |
| 本地模型 | Ollama（qwen2.5 / bge-m3 embedding） | vLLM |
| 调度 | launchd（复用既有模式） | 同 |

> 不建议 MVP 就上 Docker Compose / PostgreSQL / Qdrant：Mac mini 单用户，重栈是纯负担。等知识块过 1 万、或要多端访问时再迁。

## 四、目录结构（落在 sap-hub 下）

```text
~/sap-hub/
├── apps/
│   └── sapkb/
│       ├── ingest/          # 采集对接 collect、Compliance Gate
│       ├── process/         # SAP 实体识别、摘要、标签、分块
│       ├── kb/              # 检索、RAG、embedding
│       ├── agents/          # Cowork 编排、reviewer
│       ├── obsidian_sync/   # 写入 SAP_EXTKB vault（专栏镜像）
│       └── cli.py
├── vaults/
│   ├── SAP_FUZHKB/          # 权威库（只读守护）
│   └── SAP_EXTKB/           # 采集库（SAPKB 落地）← 新建
├── news/collect/            # 既有采集层（复用）
└── configs/sapkb/           # 本设计包 configs 落地处
```

## 五、备份与可恢复性（v3 新增）

三处状态，三种策略：

| 状态 | 策略 |
|---|---|
| SQLite（sapkb.db） | 每日 `sqlite3 .backup` 一致性快照到 `~/sap-hub/backups/sapkb/`，保留 14 天滚动 |
| SAP_EXTKB vault | git 仓库（本地裸仓即可）或纳入 Time Machine；frontmatter 即数据，可由 DB 重建门户 |
| 向量库（Chroma/LanceDB） | **定位为派生数据**：可由 chunks 表全量重建（chunks.embedding_model/vector_id 支持），不备份 |

恢复演练写进 Run 08 验收：删向量库 → 重建脚本跑通 → RAG 答案与重建前一致。

## 六、launchd 06:30 档的睡眠现实（v3 新增）

Mac 睡眠期间 `StartCalendarInterval` 不触发，唤醒后**补跑一次**。因此：
- harvest 必须**幂等**：重复跑不重复入库（source_url UNIQUE + 去重引擎天然保证，验收必测）。
- 若 Mac mini 需要保证准点：`pmset repeat wakeorpoweron MTWRFSU 06:25:00`（与既有 19:00
  流水线的处理方式对齐，二选一即可，不强制）。
