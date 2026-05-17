# Lesson 02 v4 Source Merge Log

updated_by: codex
updated_at: 2026-05-17T23:50:00+09:00

## 1. 输入来源

| 来源 | 使用方式 |
|---|---|
| `00_课程总设计_V4.md` | 采用 v4 teacher-focused 集中结构、60 分钟五动作节奏、逐字稿质量标准 |
| `04_Codex开工总提示词_V4.md` | 按 Lesson02 单课执行，不生成 Lesson03-24；生成 QA 和 handoff |
| `templates_v4/lesson_v4_teacher_focused_template.md` | 严格沿用 12 文件目录结构和逐页逐字稿页格式 |
| `prompts_v4/single_lessons/lesson_02_v4_codex_prompt.md` | 采用 Lesson02 标题、主场景、核心句型、词汇、课堂互动和课后作业 |
| `output/lesson_01_v4_teacher_focused/` | 仅作为结构和讲师入口样式参考；未覆盖 Lesson01 文件 |

## 2. 内容吸收记录

| Prompt 要求 | 本包落点 |
|---|---|
| 本课主题：“严谨细致”与“责任担当”文化 | 学生 PPT S01-S10、逐字稿 S01-S10 |
| 主场景：测试差异，原因可能来自主数据、配置、接口或用户操作 | S06、S20、练习包 Ex1/Ex8、录音作业 |
| 核心句型 4 个 | S13-S18、学生讲义第 6 节、表达附录第 1-4 节 |
| 高频词：担当範囲、未決事項、課題管理表、証跡、期限厳守 | S11-S12、讲义词汇表、术语表贡献 |
| 课堂互动：学生汇报事实、确认済み、未确认、下一步、期限 | S10、S20-S28、练习包 Ex8/Ex9 |
| 课后作业：5 句问题初报 | 学生讲义第 8 节、S28、handoff |
| 多模块 case-pack：FICO/MM/SD/Basis/ABAP-BTP | `04_case_pack/01_case_pack_appendix_all_modules.md` |
| 表达资产附录 | `05_appendix_assets/01_asset_appendix_phrase_dialogue_pitfalls.md` |
| 质量检查 | `06_management/02_quality_check_teacher_usability.md` |
| handoff | `handoff_lesson_02_v4_teacher_focused.md` 和仓库 `inbox/handoff-20260517-codex-sap-jp-lesson02-v4.md` |

## 3. 刻意没有做的事

- 未生成 Lesson03-24。
- 未覆盖或修改 Lesson01 v4。
- 未生成 30+ 分散文件。
- 未制作 PPTX / PDF / DOCX。
- 未引入外部依赖或 AI 专有格式。

## 4. 与 Lesson01 v4 的结构一致性

- 保持 12 个正式 Markdown 文件。
- 保持讲师主入口 3 文件：学生 PPT、逐页逐字稿、课堂练习包。
- 保持逐页逐字稿页格式 12 项。
- 学生 PPT 与逐字稿页码一一对应。
- case-pack 和表达资产作为附录，不干扰课堂主线。
