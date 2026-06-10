# 06｜Skill / 工具目录 v2

> 沿用 v1 的分层与命名思路，对齐你既有 skill 风格（如 `sap-daily-brief`、`sap-wechat-publisher`），
> 并标注每个 skill 是**复用既有**还是**新建**。

## 一、Skill 总览

```text
sapkb/
├── discovery/                     ← 发现线索（合规元数据）
│   ├── csdn.discover_sap          [新建]  RSSHub/搜索取 CSDN SAP 线索
│   ├── zhihu.discover_sap         [新建]  RSSHub 取知乎专栏/用户线索
│   └── wechat.discover_sap        [复用]  WeWe RSS 既有订阅
├── ingest/                        ← 入库
│   ├── import.from_clipboard      [新建]  剪藏/复制正文（含 rights 填写）
│   ├── import.from_url            [新建]  单 URL 导入（过 Compliance Gate）
│   ├── import.from_file           [新建]  PDF/Word/MD/图片 OCR
│   └── import.register_license    [新建]  登记已购授权凭证 → licenses 表
├── process/                       ← SAP 处理
│   ├── clean.html_to_markdown     [新建]
│   ├── extract.sap_entities       [新建]  模块/tcode/表/字段/配置路径/流程
│   ├── summarize.article          [新建]
│   ├── tag.auto_tag               [新建]
│   ├── dedup.detect               [复用★] 调 news/collect 去重引擎 + embedding
│   └── quality.score              [新建]
├── columns/                       ← 专栏/作者镜像（需求 8）
│   ├── author.upsert              [新建]
│   ├── column.upsert              [新建]
│   └── column.mirror_to_obsidian  [新建]  达阈值时建专栏文件夹、保篇序
├── kb/                            ← 知识库
│   ├── chunk.build                [新建]
│   ├── embed.chunks               [新建]  Ollama bge-m3
│   ├── search.hybrid              [新建]  FTS5 + 向量
│   └── answer.with_citations      [新建]  RAG，标置信层
├── audit/                         ← 审核（需求 10）
│   ├── self_check                 [新建]  执行 Agent 自审
│   ├── cross_check                [新建]  第三方 Agent 复审
│   ├── compliance.check           [新建]
│   └── verdict.record             [新建]  落 review_verdicts
└── orchestrate/
    ├── growth.harvest_backlog     [复用]  套用干货/八卦 backlog harvester 模式
    └── codex.gen_next_prompt      [新建]
```

## 二、关键 skill 规格（节选）

### discovery.csdn.discover_sap
```json
输入: { "query": "SAP F110 自动付款", "max_results": 20, "mode": "discovery_only" }
输出: { "items": [{ "title","url","author","snippet","published_at",
                    "source":"CSDN","import_policy":"metadata_only" }] }
约束: no_login / no_cookie / no_captcha_bypass / no_bulk_fulltext / metadata_only_default
```

### ingest.import.register_license（需求 5）
```json
输入: { "document_id","license_type","licensor","scope",
        "evidence_path","purchased_at","expires_at","amount" }
动作: 写 licenses 表 → 文档 rights_status=license_purchased → 按 scope 设 can_republish
校验: evidence_path 文件必须存在；scope 必填，否则按最严处理
```

### process.extract.sap_entities
```json
输出: { "modules":["FI","AP"],"tcodes":["F110","FB60"],
        "tables":["REGUH","REGUP","BSIK"],"fields":["LIFNR","BUKRS"],
        "config_paths":["SPRO>FI>AP>Business Transactions>Outgoing Payments"],
        "processes":["AP","Payment Run"],"confidence":0.91 }
```

### columns.column.mirror_to_obsidian（需求 8）
```text
当 column.item_count >= 阈值:
  在 SAP_EXTKB/02_columns/<author>/<column_title>/ 建目录
  按 column_items.seq_in_column 顺序生成 NN_<title>.md
  生成专栏 index.md（Dataview 列出全部、按篇序、标已收/未收）
  column.mirror_status = full | partial
```

### kb.answer.with_citations（需求 3）
```text
强制: 必引本地来源；不编配置路径；无来源不假装确定；
      冲突资料标差异；过期标时间风险；
      ★区分 confidence_tier：authoritative 可直接信，reference 标“需验证”
```

## 三、Skill 与既有 sap-hub skill 的关系

- 下游：SAPKB 的高质量已授权条目 → 进 `sap-daily-brief` / `干货流水线` 的 inventory 池（标来源、需改写）。
- 复用：`dedup.detect` 直接调用 `news/collect` 去重模块；不新写。
- 调度：`growth.harvest_backlog` 套用干货/八卦流水线的 backlog harvester + 状态队列。
