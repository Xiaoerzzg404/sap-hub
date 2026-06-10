# CODEX_RUN04_REPORT

## 任务
在 `apps/sapkb/tests/` 下新增 Run04 机械活 unittest：`test_kb.py`，覆盖 chunker、vector_store、embedder 接口与行为，不修改实现体，不调用外网/Ollama。

## 新增文件
- `apps/sapkb/tests/test_kb.py`

## 覆盖点
1. `chunker.chunk_document`
   - metadata_only 文档只产 1 个 chunk，`chunk_index=0`，包含 `title` 与 `summary`。
   - own_content 且正文>1500 字的文档产生多 chunk，首 chunk 含 title。
   - metadata_only 即使携带 body，也只产 1 个 title+summary chunk，不包含 body 内容。
2. `VectorStore`
   - tempfile 临时库 `vectors.db`。
   - upsert 3 条已知向量后 `count()==3`。
   - `search([1,0,0], k=2)` 返回最相近在前（cosine），分数单调递减。
   - `has(chunk_id)` 正确，重复 upsert 同 id 不增计数（INSERT OR REPLACE）。
3. `embedder` 接口
   - `embed_text` / `embed_batch` / `available` 存在且可调用。
   - 通过 `unittest.mock.patch("kb.embedder.embed_text")` 验证 `embed_batch` 逻辑，避免真实网络调用。

## 执行命令（Python 3.9）
```bash
PATH=/usr/bin:$PATH python3 -m unittest tests.test_kb -v
```

## 测试结果
```text
test_metadata_only_has_single_title_summary_chunk (tests.test_kb.TestChunker) ... ok
test_metadata_only_ignores_body_field (tests.test_kb.TestChunker) ... ok
test_own_content_long_body_generates_multiple_chunks (tests.test_kb.TestChunker) ... ok
test_embed_batch_uses_mocked_embed_text (tests.test_kb.TestEmbedder) ... ok
test_embedder_interface_exists (tests.test_kb.TestEmbedder) ... ok
test_vector_store_upsert_search_has_and_replace (tests.test_kb.TestVectorStore) ... ok

----------------------------------------------------------------------
Ran 6 tests in 0.004s

OK
```

## 备注
- 默认 `python3` 在当前 shell 指向 `3.14.4`（缺少该解释器下的 `numpy`），故本次用 `PATH=/usr/bin:$PATH` 强制调用 `/usr/bin/python3`（3.9.6）执行。
