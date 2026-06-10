# 当前阶段

**Run 04 · 本地 embedding/RAG — 已完成并通过双审（2026-06-10）**

- 真抓汪子熙：CSDN 公开文章列表 JSON API（GET 无登录、仅元数据）→ 80 篇入库，rating=5 高优先 watch。
- embedding：本机 Ollama bge-m3（1024 维），kb/embedder + chunker（metadata 只 title+summary，授权才分全文）
  + vector_store（sidecar data/vectors.db，numpy cosine，派生数据不入 git）。embed 110 块 9.4s 幂等。
- RAG：cli `embed` / `semantic-search` / `ask`。ask 经 gemma4 仅据检索材料生成中文答+内联引用+"需验证"尾注，
  低于 MIN_SCORE 拒答不脑补。stage2 接 bge_m3 语义后端（阈值 0.92）。
- 单测 tests.test_sapkb 6/6 + tests.test_kb 6/6 全绿。

下一步：Run 05（扩采更多 SAP AI 源 + 全文授权链路接 document_contents + 向量库规模化/Chroma）。
