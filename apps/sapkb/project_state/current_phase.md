# 当前阶段

**Run 06 · 分类 + 优先作者全量采集 + 全文升级 — 已完成并通过双审（2026-06-10）**

- 分类器(classifier.py)：每篇文章定一个主分类 category（FI/CO/MM/SD/ABAP/BTP 模块 或
  news/技术分析/教程/配置/故障排查/项目经验/概念/面试 内容类型）+ content_type + 关键词，接进入库流程。
- 全量采集四位优先作者（CSDN 公开 API，metadata）：汪子熙 318 / 喜欢打酱油的老鸟 320 /
  SAPmatinal 320 / Henry-SAP 62 = 共 1082 文档，全部已分类（含旧文回填）。
- clip 全文升级：clip 对已采元数据文章(同 url)做"补全文升级"——不新建、不重复计，
  content_status→fulltext_saved、rights→license_purchased(CSDN VIP subscription)，全文落 document_contents。
- 全文采集口径（Ryan 2026-06-10 定）：CSDN 文章页 521 反爬，自动直连抓不到正文；
  **采用 手动下载 + clip 升级 导入全文**（零账号风险）；自动登录态抓全文不做（账号风控风险）。
- 单测 17/17 OK。1082 文档全部 embedding 入向量库可语义检索。

下一步：Run 07（手动全文批量导入便利化 / RAG 评测 / 更多优先源）。
