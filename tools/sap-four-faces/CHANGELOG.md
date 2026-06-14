# sap-four-faces CHANGELOG

## 2026-06-14 · v0.1 (Cowork 规格 + Claude Code 实现 + Cowork 复核)
- Claude Code 按 HANDOFF.md 实现 config.py / sap_four_faces.py / faces/ / tests / README。
- 17 单测通过；audit-scripts 全绿；plan/status 对 2026-06-14 真实状态判定正确。
- 不变量验证通过：finalize 在任一面未 done 时拒写 .published（堵假完成）。
- Cowork 复核修一处：face3 深度稿 publish 必须带 --skip-lint（深度稿非 NEWS 体例，
  主文 lint 会误杀；真正门是 lint_public_text，truth-gate 未跳过）。与 per_article_runner 一致。
- 待硬化（见 HANDOFF §11）：headless --auto-content、瞬时故障 retry 分类、接 launchd 统一入口。
