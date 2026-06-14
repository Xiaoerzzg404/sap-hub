# CODEX RUN05 报告（SAPKB）

## 交付
- 新增文件：`apps/sapkb/tests/test_clip.py`
- 使用标准库 `unittest`，覆盖了临时 DB + 临时 Vault 的 5 个场景：
  - `基本导入`（`status='imported'`、`rights_status='user_imported'`、`document_contents.markdown_path` 落库且文件存在、`documents.content_status='fulltext_saved'`、inbox md 生成）
  - `必填校验`（缺 `url` 或 `content` 抛 `ValueError`）
  - `去重幂等`（同 `url` 第二次导入返回 `status='duplicate'`）
  - `license evidence 校验`（缺失证据抛 `FileNotFoundError`；证据存在时 `status='imported'` 且 `rights_status='license_purchased'`，`licenses` 有记录且 `evidence_path` 落库）
  - `全文落库位置校验`（`documents` 表无 `body` 列写入，正文在 `document_contents.markdown_path` 文件）

## 执行命令
- `python3 -m unittest tests.test_clip -v`

## 结果
```text
Ran 5 tests in 0.127s

OK
```

CODEX_RUN05_DONE
