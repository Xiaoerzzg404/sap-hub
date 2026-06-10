# 当前阶段

**Run 07 · 批量全文导入 + 按分类浏览 + RAG 评测 — 已完成并通过双审（2026-06-10）**

- clip-batch：一个文件夹（文件名=CSDN文章id）或 manifest CSV 一次批量补全文到已采元数据；
  纯数字文件名才匹配(防误配)、精确 URL 末段匹配、幂等(已全文→duplicate)、批量套 CSDN VIP 订阅授权。
- clip 升级重嵌修复：升级删旧分块 → embed 对 embedded_at 为 null 的块重嵌(向量 INSERT OR REPLACE 覆盖)，
  全文真正进 RAG（独特关键词验证命中）。
- 按分类浏览：01_by_category/ 14 个分类门户 + _INDEX（FI/CO/MM/SD/ABAP/BTP/news/技术分析…），纯 Dataview。
  write_inbox 补 category/content_type frontmatter + category/<x> 标签；regen-inbox 全量重写 1073 篇使门户可列。
- kb-eval：8 探针作答率 100%（0.60-0.82），证明 MIN_SCORE=0.6 校准良好。
- 单测 4 套全绿（test_sapkb/kb/clip/batch）。

下一步：Run 08（更多优先源 / 全文批量导入实战 / 选题→爆款联动）。
