# 下一轮任务（Run 03 候选）
- 作者/专栏 Dataview 门户镜像（02_columns / 03_authors），按 routing_policy mirror 阈值触发，保专栏篇序。
- watchlist 增量追更（R11）：authors/columns 的 last_seen 水位线 + 自适应频率。
- stage2 规模化：增量比对（本轮新增 vs 全量），避免 O(n^2) 全量重算（FinalReview W-LOW-2）。
- bge_m3 语义 embedding 后端接 Ollama（需先拉 bge-m3 模型）。
- 待 Ryan 决策：launchctl load 06:30 定时采集。
