# 07｜SAPKB 在 Obsidian 的布局、专栏镜像与阅读体验 v3.0

> 对应需求 8（专栏/作者镜像）和需求 9（高 UX 阅读）。阅读层已锁 A（Obsidian-first）。
> **v3 关键修复**：v2 让文章按模块放 `01_by_module/`、专栏镜像又在 `02_columns/` 生成
> `NN_title.md`——同一文档两份物理文件，一个去重系统自己制造重复。
> v3 原则：**物理文件唯一，视图全部虚拟（Dataview）**。

## 一、SAP_EXTKB vault 目录结构（v3）

```text
SAP_EXTKB/
├── 00_inbox/                 # 新采集暂存（有 triage 规则，见第五节）
├── 10_articles/              # ★唯一物理存放处：所有文章 md 都在这里（平铺，slug 命名）
├── 01_by_module/             # 模块视图（纯 Dataview 门户，无正文副本）
│   ├── FI_AP.md  FI_AR.md  FI_GL.md  FI_AA.md  FI_Bank.md
│   ├── CO.md  MM.md  SD.md  Cross.md
├── 02_columns/               # 专栏镜像门户（需求 8，纯 Dataview）
│   └── <作者名>__<专栏名>.md  # 按 seq_in_column 排序渲染，标"已收 N/M 篇"
├── 03_authors/               # 作者门户（Dataview 聚合 + 你的评价）
│   └── <作者名>.md
├── 04_topics/                # 主题专题门户（如"S/4 迁移 FI 差异"）
├── 05_licensed/              # 已购授权清单门户（Dataview 按 rights_status 过滤）
├── _templates/               # 笔记模板（强制 frontmatter）
├── _sources/                 # 条款快照、授权凭证副本等证据（与 FUZHKB 同模式）
├── _trash/                   # takedown 文件移入处（不直接 rm，便于审计）
├── _dataview/
│   ├── HOME.md  recent.md  needs_review.md  license_expiry.md  inbox_stale.md
└── _meta/confidence_legend.md
```

**为什么物理平铺在 `10_articles/`**：
- 一篇文章常常既属 FI/AP、又属某专栏、又属某专题——任何"按 X 分文件夹"的物理方案都会逼出副本。
- Obsidian 的检索/双链/Graph 不依赖目录结构，依赖 frontmatter + 链接。
- 移动文件 = 改 obsidian_path = 同步 DB；平铺后这件事一生只发生在 takedown 时。

## 二、文件命名（slug 规则，v3 补——中文标题直接做文件名必踩坑）

```text
<docid前8位>_<标题清洗后前40字符>.md
清洗：去除 / \ : * ? " < > | # ^ [ ]，连续空白合并为_
示例：a3f8c2d1_SAP自动付款F110配置详解.md
```

docid 前缀保证唯一（标题重名、改标题都不影响文件身份），DB 的 `obsidian_path` 与之对应。

## 三、每篇笔记的标准结构（模板，frontmatter 即数据库视图的数据源）

```markdown
---
title: SAP 自动付款 F110 配置详解
doc_id: a3f8c2d1-...
source_platform: CSDN
author: 张三
author_link: "[[03_authors/张三]]"
columns:                       # v3：数组，一文可多专栏
  - name: SAP-FI实战
    seq: 7
source_url: https://blog.csdn.net/...
imported_at: 2026-06-10
import_mode: metadata_only
rights_status: metadata_only
confidence_tier: reference
modules: [FI, AP]
tcodes: [F110, FB60]
tables: [REGUH, REGUP]
tags: [process/AP, type/configuration, level/intermediate, source/CSDN]
can_republish: false
---

> [!warning] 置信层：reference（外部采集，需验证）
> 来源：[张三 @ CSDN](原文链接) · 导入方式：metadata_only

## 摘要
（AI 生成，3–5 句）

## 关键事实（带来源）
- ...

## 我的笔记 / 验证状态
- [ ] 已在系统验证
- 与 [[SAP_FUZHKB 对应配置]] 的差异：...

## 原文
（仅当 rights_status ∈ {user_imported, license_purchased, own_content} 才落地全文）
```

## 四、专栏镜像怎么做（需求 8，v3 改为虚拟门户）

1. **触发**：作者收录 ≥5 篇 或 专栏收录 ≥3 篇（routing_policy 可调）。
2. **建门户**：生成 `02_columns/<作者>__<专栏>.md` 一个文件（不复制正文）。
3. **保篇序**：门户用 Dataview 按 frontmatter 的 `columns[].seq` 升序渲染——
   原专栏阅读顺序完整还原，点击即跳 `10_articles/` 里的物理文件。
4. **进度可视**：门户头部标"已收录 7/15 篇，缺第 3、9、12 篇"（数据来自 DB 的 column_items
   与专栏 item_count 对比，由 obsidian_sync 写入门户 frontmatter）。

```dataview
TABLE columns[0].seq AS 序, rights_status AS 授权, confidence_tier AS 置信
FROM "10_articles"
WHERE contains(columns.name, "SAP-FI实战")
SORT columns[0].seq ASC
```

> 注：多专栏文章的 Dataview 排序按其在该专栏的 seq 取值，门户生成脚本负责展开。

## 五、00_inbox 治理规则（v3 补，防垃圾场化）

- inbox 只放"已入 DB、未 triage"的条目；triage = 你确认标签/决定是否值得读。
- **7 天未 triage** → 自动出现在 `_dataview/inbox_stale.md` 仪表盘，提醒批量处理。
- triage 完成的动作只是改 frontmatter（加 `triaged: true`）+ 文件移入 `10_articles/`，
  obsidian_sync 同步 DB 的 obsidian_path。

## 六、阅读体验（需求 9）

三个插件达到目标 UX：**Dataview**（所有视图/门户）、**Omnisearch**（全文/模糊）、
**Templater**（强制 frontmatter）。HOME 仪表盘一屏看：最近收录 / 待 triage / 待验证 /
各模块条数 / 授权到期 / 镜像进度。

## 七、阅读层路线：已锁定 A（Obsidian-first）

语义问答（RAG）= 本地脚本（CLI / 命令面板），结果写回笔记或终端展示，不建 web 前端。
将来知识块过万或出现对外/多端需求，再起一轮加 web 检索层（数据已在 SQLite+向量库，迁移成本低）。
