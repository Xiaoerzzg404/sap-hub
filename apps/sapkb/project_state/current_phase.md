# 当前阶段

**Run 03 · 作者/专栏镜像 + 追更 + 优先采集/付费提醒 — 已完成并通过双审（2026-06-10）**

- 列/作者关系入库：采集记录 columns[{name,seq}] → columns 表 + column_items（保 seq_in_column）。
- 作者/专栏 Dataview 门户镜像：达阈值(作者≥5/专栏≥3)生成纯门户（不复制正文），
  专栏门户 DB 直出篇序表(权威) + Dataview 块，标"已收 N 篇/缺失篇序"，回写 mirror_status。
- watchlist 增量追更（R11）：达阈值自动 watch；last_new/last_seen 水位线；
  连续 3 轮无新→间隔×2（上限14天），计数存 authors.notes JSON（不改 schema）。
- 优先采集（Ryan 6/10 指令）：汪子熙(Jerry Wang)+SAP AI 登记为优先 watch；
  付费墙→needs_license 不硬拦、元数据照收、产「待付费提醒」(cli payment-reminders)。
- 单元测试 tests.test_sapkb 6/6 OK。launchd 06:30 已 load（~/Library/LaunchAgents）。

下一步：Run 04（本地 embedding/RAG：bge-m3 接 Ollama + 分块 + 语义问答）。
