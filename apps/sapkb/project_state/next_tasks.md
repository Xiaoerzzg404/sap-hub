# 下一轮任务（Run 04 候选）
- 本地 embedding/RAG：bge-m3 接 Ollama（需先 ollama pull bge-m3）+ chunks 分块 + 语义问答 cli。
- stage2 切 bge_m3 语义后端（阈值 0.92），并做增量比对（新增 vs 全量，避免 O(n^2)）。
- 启用 CSDN/汪子熙真实抓取：起本机 RSSHub(127.0.0.1:1200) 后 csdn_sap_search/汪子熙 route 即生效。
- W-3/W-4 加固（wikilink endswith、payment join 边界）。
