# 当前阶段

**Run 05 · 人工全文导入 + 全文 RAG + 扩采 SAP AI — 已完成并通过双审（2026-06-10）**

- 人工导入工具(docs/11 剪藏器·CLI)：`cli.py clip` 从剪贴板/文件导入你有权查看的全文 →
  document_contents(全文文件) + rights=user_imported、可选 licenses(evidence 必须存在校验)。单条手动、不登录/不cookie/不绕墙。
- 全文进 RAG：build_index 接 document_contents，授权全文真分块嵌入；ask 能命中导入的正文段（带引用，MIN_SCORE=0.6）。
- 向量库加固：按 embedding_model 过滤 + 维度守护（换模型不崩）。
- 扩采：新增 SAP 官方 AI 新闻 RSS（sap_news_ai，真抓 30 篇），加入 06:30 定时白名单。SAP AI 优先采集落地。
- 单测 17/17 OK（test_sapkb 6 + test_kb 6 + test_clip 5）。

DB 现状：144 文档 / 44 作者（汪子熙 82 篇·高优先）/ 1 license / 4 全文文档。

下一步：Run 06（扩更多优先作者+SAP AI 源、全文授权批量、RAG 答案质量评测、可选 web 检索层）。
