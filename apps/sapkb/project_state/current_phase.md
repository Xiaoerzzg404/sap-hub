# 当前阶段

**Run 12 · 学习路径 learning_path (R14 滚动版本化) — 已完成并通过双审（2026-06-10）**

- distill.build_learning_path(module)：从分类语料按阶段(入门/进阶/深入/排错,对应教程/概念/配置/项目经验/技术分析/故障排查)
  组织 beginner→advanced 阅读路线,每阶段按热度取若干篇,写 07_growth md。源 role=inspiration(阅读索引,不引事实,合规)。
- 滚动版本化:同 module 选文变化→version+1+supersedes_id+旧版 archived;选文未变→幂等不增版(指纹去重)。CLI learning-path --module FI。
- 单测 6 套 33 用例全绿。

**设计包 v3.1 的 R11–R15 已全部落地**：R11 追更/R12 热度/R13 提炼/R14 趋势+学习路径/R15 状态+发布台账。

下一步：Run 13（与既有「选题→爆款」生产线/Insight Desk 深度对接 / 真实全文批量导入实战 / Codex 恢复后重派机械活）。
