# 当前阶段

**Run 01 · 最小采集→入库闭环 — 已完成并通过双审（2026-06-10）**

闭环跑通：fixture 采集线索 → 合规门禁 → 去重(复用 collect) → 入 SQLite documents
→ 关键词标签 → CLI 查询 → 写 SAP_EXTKB/00_inbox。

验收全过：harvest 25 条(24 正主+1 转载)、metadata_only/reference、body 恒空、幂等(3 轮稳定)、
转载 canonical 归并、search F110/物料账 命中、inbox 版权头齐全、grep 无 password/cookie/login/captcha、
FUZHKB 零写入。双审 PASS_WITH_WARNINGS → W1/W2/W5 当轮修复并复验通过。

下一步：Run 02（真实源 CSDN RSSHub + stage2 embedding 去重 + 自动摘要 + launchd 06:30）。
