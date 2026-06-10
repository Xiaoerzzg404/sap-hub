# 当前阶段

**Run 02 · 真实源 + 近重复去重 + 调度 — 已完成并通过双审（2026-06-10）**

- 真实 RSS 源接入：harvest.py 支持 rss/rsshub 类型；接入 SAP 官方社区技术博客 RSS（真实可达），
  实抓 20 条 metadata_only；RSS 整篇正文 HTML 在产出前剥离+截断为 ≤280 字摘要，body 恒空。
- stage2 近重复去重：process/dedup_stage2.py（char-ngram 余弦，title/combined 双信号阈值），
  命中真转载对落 audit_logs needs_review，**不自动归并**（auto_merge=false）。bge_m3 后端预留 Run04。
- launchd 调度脚手架：com.ryan.sapkb.harvest-at-0630.plist（06:30，RunAtLoad=false，**未 load**）
  + harvest_runner.sh（draft-only、不发布、macOS bash 3.2 兼容、指向实时 config）。

下一步：Run 03（作者/专栏 Dataview 门户镜像 + watchlist 增量追更）。
待 Ryan 决策：是否 launchctl load 06:30 定时（recurring 对外 GET，draft-only）。
