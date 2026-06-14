# sap-four-faces CHANGELOG

## 2026-06-14 · v0.1 (Cowork 规格 + Claude Code 实现 + Cowork 复核)
- Claude Code 按 HANDOFF.md 实现 config.py / sap_four_faces.py / faces/ / tests / README。
- 17 单测通过；audit-scripts 全绿；plan/status 对 2026-06-14 真实状态判定正确。
- 不变量验证通过：finalize 在任一面未 done 时拒写 .published（堵假完成）。
- Cowork 复核修一处：face3 深度稿 publish 必须带 --skip-lint（深度稿非 NEWS 体例，
  主文 lint 会误杀；真正门是 lint_public_text，truth-gate 未跳过）。与 per_article_runner 一致。
- 待硬化（见 HANDOFF §11）：headless --auto-content、瞬时故障 retry 分类、接 launchd 统一入口。

## 2026-06-14 · v0.3 Insight Desk 去重（Ryan 指示）
- 新增 `insight_source.py`：选题只从 Insight Desk feed 取 `publishStatus.<platform>=not_published`
  且未被 reuseStatus 阻断的条目；发布后调 `record_publish.js` 写回（draft_created）。
- Face1/Face3 已接入：content_request 列出 eligible 条目；发布成功后自动 `mark_from_md` 写回。
- 本地 `state/consumed.json`（canonicalUrl 键，保留 21 天）作安全网，兜底 feed 传播滞后。
- 回填：把 6-14 已发的 9 条 ×2 平台写入 publish-ledger。
- 34 单测全绿（含 insight_source 3 条）。
- 【codex 侧待修 · 已知问题】Insight Desk feed 的 `articleId` 是内容哈希、每次重建会变，
  publish-ledger→feed 的 publishStatus 传播按 articleId 匹配不稳定；稳定键应是 canonicalUrl。
  这属于 insight-desk 的 build_agent_feed_lite/auto-update 范畴（codex 维护），建议在那侧改成
  canonicalUrl 优先匹配。四面台已用本地 consumed 安全网规避此延迟，不阻塞。
