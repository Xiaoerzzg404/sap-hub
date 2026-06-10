# 当前阶段

**Run 11 · insight 据证据成稿 + R15 发布台账 — 已完成并通过双审（2026-06-10）**

- distill.draft_insight：取 insight 的 evidence 源【授权全文】喂本机 gemma4 写带[n]引用的中文草稿（inspiration 仅供角度，
  不可当事实）；无 evidence 全文 → 不调 LLM、只列选题角度、不产事实正文。status draft→in_review。实测模型
  在 evidence 与标题不符时拒绝编造、只写资料实含内容（防脑补验证通过）。CLI insight-draft。
- distill.record_publication（R15）：人工发布后登记台账 publications（平台 CHECK），幂等（同 insight+platform 不重复记），
  insight status→published。**发布动作永远人工，本工具只登记不对外推送**。CLI publish-log。
- 单测 6 套全绿。

**全链闭环完成**：采集→去重→分类/标签→热度/趋势→选题→提炼(版权硬隔离)→据证据成稿(不脑补)→人工发布→台账。

下一步：Run 12（学习路径 learning_path R14 滚动版本化 / 与既有内容生产线深度对接 / 真实全文批量导入实战）。
