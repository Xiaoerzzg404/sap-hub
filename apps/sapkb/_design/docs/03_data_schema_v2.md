# 03｜数据模型 v3.0

> 在 v1 五张表基础上新增 **authors / columns / column_items / licenses / review_verdicts**。
> v3 相对 v2 的修复（详见 `00b_review_v2_to_v3.md`）：
> ① FTS5 改 trigram（中文可用）+ 可回查列；② 删除 `documents.column_id`（与 column_items 矛盾）；
> ③ 补 UNIQUE/CHECK/索引；④ chunks 增加 embedding 元数据；⑤ documents 支持 takedown。
> 可直接执行的 DDL 见 `configs/schema.sql`（已在 SQLite 3.45 实测通过）。

## 一、表关系总览

```text
authors ─┬─< columns ─< column_items >─ documents
         └─< documents
documents ─┬─< document_contents
           ├─< document_tags
           ├─< chunks  (含 embedding_model / vector_id)
           ├─< licenses            (已购授权凭证)
           └─< review_verdicts     (分级审核裁决)
documents_fts (trigram 全文索引, document_id 回查)
audit_logs (横切)
```

**v3 关键变化：专栏关系唯一真相 = `column_items`**。
一篇文章可进多个专栏（知乎常见），v2 的 `documents.column_id` 单值外键与多对多表必然不同步，已删除。

## 二、新增/关键表

### authors（作者）— 需求 8
`UNIQUE(platform, platform_uid)` 是 upsert 的依据（v3 补）。字段同 v2：
name / platform / platform_uid / homepage_url / doc_count / is_mirrored / notes。

### columns（专栏）— 需求 8
`UNIQUE(platform, source_url)`。`mirror_path` 在 v3 指向 **Dataview 门户 index.md**，
不再指向正文副本目录（物理文件唯一原则，见 docs/07）。

### column_items（专栏-文章 + 篇序）— 需求 8
`(column_id, document_id)` 主键 + `seq_in_column` 保原专栏篇序。镜像门户按此排序渲染。

### licenses（已购授权凭证）— 需求 5b
同 v2，v3 把 `license_type` 与 `scope` 升级为 CHECK 枚举：
scope ∈ {individual, derivative, commercial}，缺省按最严。`evidence_path` 文件存在性由应用层校验。

### review_verdicts（分级审核裁决）— 需求 10
v3 变化：
- 新增 `review_tier`（0=规则审 / 1=LLM 单审 / 2=LLM 双审），对应 docs/08 的分级审核。
- `self_check_result` 拆为 **result（枚举，可统计）+ notes（理由）** 两列；cross 同理。
- `verdict ∈ {pass, rework, escalate_to_human}`。

## 三、全文检索（v3 重做）

```sql
CREATE VIRTUAL TABLE documents_fts USING fts5(
  document_id UNINDEXED, title, summary, body, tokenize='trigram');
```

- **为什么不是 unicode61**：unicode61 不分词中文，中文标题/摘要基本搜不到——v2 的致命缺陷。
- **为什么不是 contentless**：v2 的 `content=''` 不能 UPDATE、查不回原文、且与 TEXT 主键的
  documents 没有映射列。v3 用普通表 + `document_id UNINDEXED`，几万篇规模空间冗余可忽略。
- **查询规则（已实测）**：≥3 字符用 `MATCH`；1–2 字查询用 `LIKE '%xx%'`；
  模块/tcode（"FI"、"F110"）优先走 `document_tags` 精确查询。
- **同步规约（ingest 层职责）**：documents 的插入/更新/删除三处必须同步 documents_fts；
  metadata_only 文档 body 留空，仅索引 title+summary。

## 四、状态枚举 v3（已写进 DDL 的 CHECK 约束）

```text
content_status:
  discovered → metadata_saved → summary_saved → fulltext_saved
            → processed → chunked → embedded
  终态分支： blocked（合规拒绝） / removed（takedown 后）

rights_status:
  unknown / metadata_only / summary_only / user_imported /
  license_purchased / fulltext_allowed / own_content / blocked / takedown(新)

confidence_tier:
  authoritative（FUZHKB/自有已验证） / reference（外部采集，需验证）
```

**审核 gate 挂在状态转移上（v3 明确，解决 v2 三处文档矛盾）**：
- `→ metadata_saved`：只过 **Tier 0 规则审**（代码校验，零 LLM）。
- `→ fulltext_saved`、`→ embedded`、`→ 选题池`：必须过 **Tier 2 双审**（docs/08）。

## 五、takedown（作者/平台要求下架）— v3 新增

```text
收到下架要求
  → documents.rights_status='takedown', takedown_requested_at/reason 落盘
  → 传播删除：documents_fts 行删除 → chunks 按 vector_id 删向量库 → obsidian_path 文件移入 _trash/
  → content_status='removed'；audit_logs 记全程
  → 备份中的副本按备份保留期自然滚出（文档化告知即可，不追溯改历史备份）
```

## 六、documents 表 v3 增量字段

| 字段 | 说明 |
|---|---|
| source_url UNIQUE | URL 级去重硬约束（应用层先规范化 URL 再写入） |
| takedown_requested_at / takedown_reason | 下架支持 |
| obsidian_path | 唯一物理 md 路径（`10_articles/` 下，见 docs/07） |
| embedding_dedup_hash | 标题+摘要向量指纹（两段式去重，见 docs/05） |

## 七、chunks 与向量库一致性（v3 新增）

| 字段 | 用途 |
|---|---|
| embedding_model | 嵌入所用模型名；换模型时 `WHERE embedding_model != 当前模型` 找出需重嵌块 |
| embedded_at | null = 尚未嵌入（增量嵌入的队列依据） |
| vector_id | 向量库内 id；chunk 删除/更新时据此同步删除向量，防止"幽灵向量" |
