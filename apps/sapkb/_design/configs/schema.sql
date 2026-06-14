-- SAPKB 数据模型 v3.0  (SQLite >= 3.34，可直接执行)
-- v2→v3 变更：
--   1) FTS5 改 trigram 分词（中文可用）+ 普通表 + document_id 回查列（弃用 contentless）
--   2) 删除 documents.column_id（专栏关系唯一真相 = column_items）
--   3) 补 UNIQUE / CHECK / 索引；review_verdicts 拆 result 与 notes
--   4) chunks 增加 embedding 元数据（换模型可识别需重嵌块）
--   5) documents 增加 takedown 支持

PRAGMA foreign_keys = ON;

-- ============ 作者（需求8）============
CREATE TABLE IF NOT EXISTS authors (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  platform      TEXT,                 -- csdn / zhihu / wechat / shipinhao
  platform_uid  TEXT,                 -- 平台作者标识（主页 URL 或 ID）
  homepage_url  TEXT,
  doc_count     INTEGER DEFAULT 0,
  is_mirrored   INTEGER DEFAULT 0,
  notes         TEXT,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  UNIQUE (platform, platform_uid)     -- upsert 依据（v3）
);

-- ============ 专栏（需求8）============
CREATE TABLE IF NOT EXISTS columns (
  id            TEXT PRIMARY KEY,
  author_id     TEXT REFERENCES authors(id),
  title         TEXT NOT NULL,
  platform      TEXT,
  source_url    TEXT,
  item_count    INTEGER DEFAULT 0,
  mirror_status TEXT DEFAULT 'none'
                CHECK (mirror_status IN ('none','partial','full')),
  mirror_path   TEXT,                 -- Dataview 门户 index.md 路径（v3：不再复制正文）
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  UNIQUE (platform, source_url)
);

-- ============ 文档 ============
CREATE TABLE IF NOT EXISTS documents (
  id                    TEXT PRIMARY KEY,
  title                 TEXT NOT NULL,
  source_platform       TEXT,
  source_url            TEXT UNIQUE,             -- v3：URL 级去重的硬约束
  author_id             TEXT REFERENCES authors(id),
  -- column_id 已删除（v3）：专栏关系唯一走 column_items
  published_at          TEXT,
  imported_at           TEXT NOT NULL,
  import_mode           TEXT NOT NULL
                        CHECK (import_mode IN
                          ('metadata_only','summary_only',
                           'fulltext_user_imported','license_purchased','own_content')),
  rights_status         TEXT NOT NULL
                        CHECK (rights_status IN
                          ('unknown','metadata_only','summary_only','user_imported',
                           'license_purchased','fulltext_allowed','own_content',
                           'blocked','takedown')),
  content_status        TEXT NOT NULL
                        CHECK (content_status IN
                          ('discovered','metadata_saved','summary_saved','fulltext_saved',
                           'processed','chunked','embedded','blocked','removed')),
  confidence_tier       TEXT DEFAULT 'reference'
                        CHECK (confidence_tier IN ('authoritative','reference')),
  canonical_document_id TEXT REFERENCES documents(id),  -- 转载归并指向正主
  quality_score         REAL,
  summary               TEXT,
  language              TEXT,
  confidential          INTEGER DEFAULT 0,
  takedown_requested_at TEXT,                    -- v3：作者/平台要求下架
  takedown_reason       TEXT,
  obsidian_path         TEXT,                    -- 唯一物理 md（10_articles/ 下，v3）
  embedding_dedup_hash  TEXT,
  created_at            TEXT NOT NULL,
  updated_at            TEXT NOT NULL
);

-- ============ 专栏-文章关系 + 篇序（需求8 保结构核心）============
CREATE TABLE IF NOT EXISTS column_items (
  column_id      TEXT NOT NULL REFERENCES columns(id),
  document_id    TEXT NOT NULL REFERENCES documents(id),
  seq_in_column  INTEGER,
  PRIMARY KEY (column_id, document_id)
);

CREATE TABLE IF NOT EXISTS document_contents (
  document_id   TEXT PRIMARY KEY REFERENCES documents(id),
  raw_path      TEXT,
  markdown_path TEXT,
  text_hash     TEXT,
  simhash       TEXT,
  token_count   INTEGER
);

CREATE TABLE IF NOT EXISTS document_tags (
  id           TEXT PRIMARY KEY,
  document_id  TEXT NOT NULL REFERENCES documents(id),
  tag_type     TEXT NOT NULL,        -- module/process/tcode/table/field/config_path/type/level/source
  tag_value    TEXT NOT NULL,
  confidence   REAL,
  generated_by TEXT,
  created_at   TEXT NOT NULL,
  UNIQUE (document_id, tag_type, tag_value)
);

CREATE TABLE IF NOT EXISTS chunks (
  id               TEXT PRIMARY KEY,
  document_id      TEXT NOT NULL REFERENCES documents(id),
  chunk_index      INTEGER NOT NULL,
  heading_path     TEXT,
  content          TEXT NOT NULL,
  token_count      INTEGER,
  source_url       TEXT,
  embedding_model  TEXT,             -- v3：嵌入用的模型名（换模型时识别需重嵌块）
  embedded_at      TEXT,             -- v3：null = 尚未嵌入
  vector_id        TEXT,             -- v3：向量库中的 id（删除/更新时同步向量库）
  created_at       TEXT NOT NULL,
  UNIQUE (document_id, chunk_index)
);

-- ============ 已购授权凭证（需求5b 版权）============
CREATE TABLE IF NOT EXISTS licenses (
  id            TEXT PRIMARY KEY,
  document_id   TEXT NOT NULL REFERENCES documents(id),
  license_type  TEXT NOT NULL
                CHECK (license_type IN
                  ('purchase','subscription','written_permission','cc_license')),
  licensor      TEXT,
  scope         TEXT NOT NULL
                CHECK (scope IN ('individual','derivative','commercial')),
  evidence_path TEXT NOT NULL,       -- 发票/许可截图本地路径（应用层校验文件存在）
  purchased_at  TEXT,
  expires_at    TEXT,                -- null = 永久
  amount        REAL,
  verified_by   TEXT,
  created_at    TEXT NOT NULL
);

-- ============ 审核裁决（需求10，v3 拆 result/notes）============
CREATE TABLE IF NOT EXISTS review_verdicts (
  id                 TEXT PRIMARY KEY,
  target_type        TEXT NOT NULL
                     CHECK (target_type IN
                       ('document','chunk','answer','agent_output','license','pipeline_item')),
  target_id          TEXT NOT NULL,
  review_tier        INTEGER NOT NULL DEFAULT 2,   -- 0=规则审 1=单审 2=双审（v3）
  self_check_by      TEXT,
  self_check_result  TEXT CHECK (self_check_result IN ('pass','warning','fail')),
  self_check_notes   TEXT,                          -- 理由（JSON 或文本）
  cross_check_by     TEXT,
  cross_check_result TEXT CHECK (cross_check_result IN ('pass','warning','fail')),
  cross_check_notes  TEXT,
  verdict            TEXT CHECK (verdict IN
                       ('pass','rework','escalate_to_human')),
  disagreement       TEXT,
  created_at         TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id            TEXT PRIMARY KEY,
  target_type   TEXT NOT NULL,
  target_id     TEXT NOT NULL,
  audit_type    TEXT NOT NULL,
  status        TEXT NOT NULL,
  risk_level    TEXT,
  findings_json TEXT,
  created_by    TEXT,
  created_at    TEXT NOT NULL
);

-- ============ 全文检索（v3：trigram 中文可用 + 可回查）============
-- 说明：
--  * trigram 需 SQLite >= 3.34；中文/英文/混合文本均可检索。
--  * 查询层规则（已实测）：>=3 字符用 MATCH；1-2 字符查询用 LIKE '%xx%'（trigram 表可返回
--    正确结果），模块/tcode 等结构化短词优先走 document_tags 精确查询。
--  * 普通表（非 contentless）：可 UPDATE/DELETE，可直接取回 title/summary。
--  * 同步规约：documents 的 INSERT/UPDATE/DELETE 必须同步本表（ingest 层职责，见 docs/03）。
CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
  document_id UNINDEXED,
  title,
  summary,
  body,
  tokenize = 'trigram'
);

-- ============ 索引 ============
CREATE INDEX IF NOT EXISTS idx_documents_author    ON documents(author_id);
CREATE INDEX IF NOT EXISTS idx_documents_rights    ON documents(rights_status);
CREATE INDEX IF NOT EXISTS idx_documents_status    ON documents(content_status);
CREATE INDEX IF NOT EXISTS idx_documents_canonical ON documents(canonical_document_id);
CREATE INDEX IF NOT EXISTS idx_column_items_doc    ON column_items(document_id);
CREATE INDEX IF NOT EXISTS idx_tags_doc            ON document_tags(document_id);
CREATE INDEX IF NOT EXISTS idx_tags_value          ON document_tags(tag_type, tag_value);
CREATE INDEX IF NOT EXISTS idx_chunks_doc          ON chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_licenses_doc        ON licenses(document_id);
CREATE INDEX IF NOT EXISTS idx_verdicts_target     ON review_verdicts(target_type, target_id);

-- ============ updated_at 自动维护 ============
CREATE TRIGGER IF NOT EXISTS trg_documents_updated
AFTER UPDATE ON documents
BEGIN
  UPDATE documents SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- ====================================================================
-- v3.1 增量（R11–R15：持续采集 / 知识沉淀 / 提炼 / 趋势 / 自媒体状态）
-- 以下为增量 DDL，可在 v3.0 库上直接执行（ALTER + 新表）
-- ====================================================================

-- ---- R11 订阅监视（watchlist：作者/专栏持续追更）----
ALTER TABLE authors ADD COLUMN watch_enabled       INTEGER DEFAULT 0;
ALTER TABLE authors ADD COLUMN watch_interval_days INTEGER DEFAULT 3;
ALTER TABLE authors ADD COLUMN last_checked_at     TEXT;
ALTER TABLE authors ADD COLUMN last_new_item_at    TEXT;
ALTER TABLE authors ADD COLUMN manual_rating       INTEGER;          -- 你打的 1-5 星（R12 口碑信号）

ALTER TABLE columns ADD COLUMN watch_enabled       INTEGER DEFAULT 0;
ALTER TABLE columns ADD COLUMN watch_interval_days INTEGER DEFAULT 3;
ALTER TABLE columns ADD COLUMN last_checked_at     TEXT;
ALTER TABLE columns ADD COLUMN last_seen_published_at TEXT;          -- 增量水位线：只取此后新文

-- ---- R12 热度/口碑信号（documents 缓存列，公式见 routing_policy）----
ALTER TABLE documents ADD COLUMN repost_count      INTEGER DEFAULT 0; -- 由去重归并计数维护
ALTER TABLE documents ADD COLUMN platform_count    INTEGER DEFAULT 1; -- 同文出现的平台数
ALTER TABLE documents ADD COLUMN manual_rating     INTEGER;           -- 你打星
ALTER TABLE documents ADD COLUMN popularity_score  REAL;              -- 缓存：按公式定期重算

-- ---- R15 自媒体编辑状态（源文章视角：这篇被用到什么程度）----
ALTER TABLE documents ADD COLUMN editorial_status  TEXT DEFAULT 'none'
  CHECK (editorial_status IN ('none','shortlisted','distilled','parked'));
-- none=未动 / shortlisted=入选题池 / distilled=已被提炼引用 / parked=看过暂不用

-- ---- R13 提炼产物（insights：知识卡/经验条/干货稿/趋势报告/学习路径）----
CREATE TABLE IF NOT EXISTS insights (
  id             TEXT PRIMARY KEY,
  type           TEXT NOT NULL
                 CHECK (type IN ('knowledge_card','experience_note','growth_article',
                                 'trend_report','learning_path')),
  title          TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft','in_review','approved','scheduled',
                                   'published','archived')),
  modules        TEXT,               -- JSON 数组缓存（权威数据在 frontmatter/tags）
  obsidian_path  TEXT,               -- 落在 SAP_EXTKB/06_insights/ 或 07_growth/
  created_by     TEXT,               -- 哪个 Agent/人产出
  reviewed_tier  INTEGER,            -- 过的审核级别（提炼产物一律 Tier 2）
  version        INTEGER DEFAULT 1,  -- learning_path / trend_report 滚动修订用
  supersedes_id  TEXT REFERENCES insights(id),  -- 新版指向被取代的旧版
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);

-- 提炼产物 ↔ 源文档（多对多，含来源角色；版权追溯的关键链路）
CREATE TABLE IF NOT EXISTS insight_sources (
  insight_id   TEXT NOT NULL REFERENCES insights(id),
  document_id  TEXT NOT NULL REFERENCES documents(id),
  role         TEXT DEFAULT 'evidence'
               CHECK (role IN ('evidence','inspiration','counterpoint')),
  -- evidence=事实依据(须授权可引) / inspiration=仅选题启发(metadata_only 只能当这个) / counterpoint=反方观点
  PRIMARY KEY (insight_id, document_id)
);

-- ---- R15 发布记录（一稿多平台）----
CREATE TABLE IF NOT EXISTS publications (
  id            TEXT PRIMARY KEY,
  insight_id    TEXT NOT NULL REFERENCES insights(id),
  platform      TEXT NOT NULL
                CHECK (platform IN ('wechat_mp','shipinhao','xiaohongshu',
                                    'zhihu','course','other')),
  published_at  TEXT,
  url           TEXT,
  performance_notes TEXT,            -- 阅读/点赞等表现，手工或后续回填
  created_at    TEXT NOT NULL
);

-- ---- R14 趋势快照（标签时间序列，季度/月度物化）----
CREATE TABLE IF NOT EXISTS trend_snapshots (
  id            TEXT PRIMARY KEY,
  period        TEXT NOT NULL,       -- 如 2026-Q2 / 2026-06
  tag_type      TEXT NOT NULL,       -- module/tcode/topic/new_term
  tag_value     TEXT NOT NULL,
  doc_count     INTEGER NOT NULL,
  new_author_count INTEGER DEFAULT 0,
  delta_pct     REAL,                -- 环比变化
  created_at    TEXT NOT NULL,
  UNIQUE (period, tag_type, tag_value)
);

-- ---- R14 新词候选（taxonomy 外的高频新术语 → 人工收编）----
CREATE TABLE IF NOT EXISTS term_candidates (
  id           TEXT PRIMARY KEY,
  term         TEXT NOT NULL UNIQUE,
  first_seen   TEXT NOT NULL,
  freq_30d     INTEGER DEFAULT 0,
  status       TEXT DEFAULT 'pending'
               CHECK (status IN ('pending','accepted','rejected')),
  accepted_as  TEXT,                 -- 收编进 taxonomy 的位置（如 cross_topics/SAP_AI）
  created_at   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_documents_editorial ON documents(editorial_status);
CREATE INDEX IF NOT EXISTS idx_insights_status     ON insights(type, status);
CREATE INDEX IF NOT EXISTS idx_insight_sources_doc ON insight_sources(document_id);
CREATE INDEX IF NOT EXISTS idx_pub_insight         ON publications(insight_id);
CREATE INDEX IF NOT EXISTS idx_trend_period        ON trend_snapshots(period);
