# SAPKB Run03 回归测试报告

## 产出文件
1. `apps/sapkb/tests/test_sapkb.py`
2. `apps/sapkb/CODEX_RUN03_REPORT.md`

## 跑法
执行命令：

```bash
cd /Users/openclawxiaoer/sap-hub/apps/sapkb
/usr/bin/python3 -m unittest tests.test_sapkb -v
```

## 测试覆盖
- `harvest fixture`：
  - 校验 `from ingest import harvest` 的 `harvest_source("fixture_csdn")`。
  - 断言返回条数 `>=20`。
  - 断言每条不含 `body`/`content`/`text`。
  - 断言 `summary` 长度 `<= 281`。
- `compliance_gate`：
  - 校验含 `会员专享` 的记录 `evaluate()` 返回 `blocked=True` 且 `rights_status="blocked"`。
  - 校验普通记录 `blocked=False` 且 `confidence_tier="reference"`。
  - 校验带 `body` 的普通记录 `allow_fulltext=False`。
- `dedup`：
  - 校验 `dedup.REUSED_COLLECT is True`。
  - 校验 `fingerprint()` 对同一 URL 的 `canonical_url` 一致性。
- `tag_keyword`：
  - 对 `tag('SAP CO-PA 与 MM 采购 ME21N', 'ACDOCA KE30')` 检查必须包含 `module CO`、`module MM`、`tcode ME21N`、`table ACDOCA`。
- `dedup_stage2`：
  - 用接近标题构造 2 条，断言 `find_near_duplicates` 命中 1 对且 `signal` 包含 `title`。
  - 用两条无关标题断言命中 0 对。
  - `backend='bge_m3'` 调用 `_vectorize` 时断言抛出 `NotImplementedError`。
- `schema`：
  - 从 `~/sap-hub/configs/sapkb/schema.sql` 建临时库。
  - 插入一条文档与 FTS 行，校验 `documents_fts MATCH '自动付款'` 命中数 `>=1`。

## 运行结果
执行命令：

```bash
cd /Users/openclawxiaoer/sap-hub/apps/sapkb
/usr/bin/python3 -m unittest tests.test_sapkb -v
```

标准输出：

```text
test_compliance_gate_block_and_allowlist (tests.test_sapkb.TestSapkbRun03) ... ok
test_dedup_reused_collect (tests.test_sapkb.TestSapkbRun03) ... ok
test_dedup_stage2_near_duplicates (tests.test_sapkb.TestSapkbRun03) ... ok
test_harvest_fixture_csdn (tests.test_sapkb.TestSapkbRun03) ... ok
test_schema_sql_initialize_and_fts (tests.test_sapkb.TestSapkbRun03) ... ok
test_tag_keyword_co_mm_me21n_acdoca (tests.test_sapkb.TestSapkbRun03) ... ok

----------------------------------------------------------------------
Ran 6 tests in 0.040s

OK
```

额外说明：
- 命令返回码：0
- 运行时有系统级 warning（DARWIN_USER_TEMP_DIR），不影响 unittest 结果

## 风险
- 未改实现体，只做测试层回归。
- `dedup` 的 collect 复用依赖当前环境 `collect_lib` 可用；若运行环境缺失 `collect_lib`，`REUSED_COLLECT` 会变为 `False` 并导致测试失败，属于环境依赖性失败。
