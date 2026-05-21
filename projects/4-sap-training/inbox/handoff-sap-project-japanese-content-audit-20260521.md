# Handoff · SAP 项目日语内容审校 · 2026-05-21

- updated_by: codex
- updated_at: 2026-05-21T22:35:44+09:00
- branch: codex/sap-jp-content-audit-20260521
- scope: sap-jp.training Markdown 内容源审校；重点为 SAP 项目阶段、会议、术语、讲解说明

## 做了什么

1. 追踪网站内容源，确认 `web/data/*.json` 由以下 Markdown 生成：
   - `projects/4-sap-training/SAP日语培训/output/`
   - `projects/4-sap-training/sap_jp_training_course/output/`
2. 发现旧 `SAP日语培训/output/01_单课课程设计稿/*.md` 的课名覆盖网站 Lesson 标题，但与 V4 正式课程总览不一致。
3. 已将 24 个课程设计稿的 H1、正式主题、SAP 模块、项目阶段、顾问能力、日语能力、最终输出任务、重点场景对齐 V4。
4. 已在每个课程设计稿顶部加入 `## 0. 日本 SAP 顾问审校修正（2026-05-21）`，明确旧 Input 摘要只作为来源线索，不作为正式教学主线。
5. 已补强全局内容源：
   - `SAP日语高频术语总表.md`：项目阶段、会议体、交付物、问题管理术语。
   - `SAP日语高频句型总表.md`：Kickoff、要件定義、配置/测试、上线/运维优先句型。
   - `SAP日语培训学生讲义.md`：学生视角项目地图、误用词组、最低合格输出。
   - `SAP日语培训讲师手册.md`：讲师授课口径、纠错模板、Lesson 14-24 合格标准。
   - `全课程质量审查报告.md`：人工审校结论与剩余风险。
6. 已给 Lesson 14-24 的每课术语表补入 55 个项目阶段/会议/交付物/问题管理术语，使 `/glossary` 检索也能命中这些项目词。
7. 已新增可复用 Codex 提示词：
   - `projects/4-sap-training/sap_jp_training_course/prompts_v4/batch/sap_project_japanese_content_audit_prompt_20260521.md`

## 验证

- `cd projects/4-sap-training/web && npm run convert:content`：PASS。
- 转换结果：`Converted 24 lessons, 583 terms, 480 phrases.`
- 抽查 `web/data/lessons.json`：
  - `lesson_14` -> `项目启动会议日语表达`
  - `lesson_15` -> `需求调研日语交流`
  - `lesson_18` -> `测试阶段日语交流`
  - `lesson_19` -> `项目上线支持日语`
  - `lesson_20` -> `运维阶段日语交流`
  - `lesson_24` -> `职场问题应对日语`
- `web/data/_meta.json` 已恢复并保留 `schemaVersion: 1.4.0`、backend、compliance、Phase 5-7 notes。

## 剩余风险 / 下一步

- 本轮没有逐字重写 24 课课堂逐字稿；旧 Input 摘要仍保留，但已在课程设计稿标明不作为正式教学主线。
- 若要让线上数据库立即显示新内容，需要在目标环境重新执行内容 seed 流程；本轮只更新 Markdown 源和静态 JSON 生成物。
- 后续建议优先逐课深改 Lesson 14-20 与 22-24 的课堂逐字稿，把旧摘要中的中文嵌入句彻底替换为 V4 项目场景日语。
