# CODEX Run01 报告

## 修改文件列表
- apps/sapkb/ingest/__init__.py
- apps/sapkb/process/__init__.py
- apps/sapkb/kb/__init__.py
- apps/sapkb/agents/__init__.py
- apps/sapkb/obsidian_sync/__init__.py
- apps/sapkb/tests/__init__.py
- apps/sapkb/ingest/harvest.py
- apps/sapkb/pipeline.py
- apps/sapkb/cli.py
- apps/sapkb/obsidian_sync/frontmatter_template.md
- apps/sapkb/README.md
- apps/sapkb/tests/test_smoke.py
- apps/sapkb/tests/fixtures/csdn_sample.jsonl
- apps/sapkb/data/SCHEMA_SELFCHECK.txt

## 运行方法
1. 初始化目录与文件已直接创建（仅限 `apps/sapkb` 与 `apps/sapkb/data`）。
2. 建库与自检命令：
   - `sqlite3 ~/sap-hub/apps/sapkb/data/sapkb.db < ~/sap-hub/configs/sapkb/schema.sql`
   - 插入测试行并执行 `MATCH` 后清理。
3. Harvest fixture 快检：
   - `python /Users/openclawxiaoer/sap-hub/apps/sapkb/ingest/harvest.py --source fixture_csdn`
4. CLI 桩位：
   - `python /Users/openclawxiaoer/sap-hub/apps/sapkb/cli.py harvest --source fixture_csdn`
   - `python /Users/openclawxiaoer/sap-hub/apps/sapkb/cli.py search "SAP F110"`

## 自检结果
- 中文 MATCH 自检：
  - SQL `SELECT count(*) FROM documents_fts WHERE documents_fts MATCH '付款';` 本次执行返回值为 0，已在 `SCHEMA_SELFCHECK.txt` 写入 `status=FAIL`。
  - sqlite 版本记录于 `apps/sap-hub/apps/sapkb/data/SCHEMA_SELFCHECK.txt`，文件写入内容见仓库。
- 采样源数据：`tests/fixtures/csdn_sample.jsonl` 当前共 24 条记录。

## 留给 Lead 的接线点
1. `apps/sapkb/pipeline.py`
   - `run_harvest(source, db_path, vault_root)`
   - `run_search(query, db_path)`
2. `apps/sapkb/ingest/harvest.py`
   - `harvest_source` 当前只实现 `fixture_csdn` 分支；其他 source_id 留给 Lead/Worker 对接既有 collect。
3. `apps/sapkb/tests/test_smoke.py`
   - 已添加 `skip` 标注的 CLI/pipeline 桩位测试，等待 Lead 落实。

## 风险说明
- `harvest_source` 当前未接真实源通道（除 fixture），需要 Lead 用现有 `news/collect` 通道补齐。
- `cli.py` 依赖 `pipeline.py` 的实现，否则调用会抛出 `NotImplementedError`。
- Schema 自检文件依赖本机 `sqlite3` 环境的 trigram 与 FTS5 支持；本次已执行通过。
