# Lesson 01 v4 Source Merge Log

updated_by: codex
updated_at: 2026-05-17T00:40:00+09:00

## 1. 合并原则

本轮不是继续扩写 Lesson 01，而是把 v1/v2/v3 中有效内容去重、收束、重构为讲师可用成果包。

采用优先级：

```text
v3 > v2 > v1
```

但以下内容保留 v1/v2：

- v1 中更自然的中文讲师口播；
- v1 中更容易课堂使用的 Roleplay 场景；
- v2 中更清晰的学生讲义、作业提交格式、会前速查结构；
- v2 中对 `おっしゃる通りです` 边界的说明；
- v1/v2 中对 SAP 项目真实会议感更强的例句。

## 2. 来源文件吸收表

| 来源文件 | 是否读取 | 吸收内容 | 合并到 v4 哪个文件 | 备注 |
|---|---|---|---|---|
| `output/lesson_01/lesson_01_teacher_script.md` | 是 | 开场中文口播、真实会议压力、Roleplay 点评方式、分段授课语气 | `01_teacher_core/01_teacher_full_script_slide_by_slide.md` | 保留 v1 的自然中文讲师口吻，去掉旧版对 `おっしゃる通りです` 的默认依赖 |
| `output/lesson_01/lesson_01_ppt_outline.md` | 是 | v1 的 18 页基础结构、核心词汇和初始场景 | `02_student_materials/01_student_ppt_outline_final.md` | 被 v3 34 页结构覆盖，只保留早期场景感 |
| `output/lesson_01/lesson_01_student_handout.md` | 是 | “和不是迎合”、核心词汇、SAP 使用场景、错误表达 vs 推荐表达 | `02_student_materials/02_student_handout_homework.md`、`05_appendix_assets/01_asset_appendix_phrase_dialogue_pitfalls.md` | 与 v2/v3 去重后保留更清晰表述 |
| `output/lesson_01/lesson_01_phrases.md` | 是 | 会议表达、需求确认、风险说明、邮件表达、SAP 项目专用表达 | `05_appendix_assets/01_asset_appendix_phrase_dialogue_pitfalls.md` | 合并进 Phrase Bank |
| `output/lesson_01/lesson_01_roleplay.md` | 是 | SD-FI 和 MM-FI 真实 Roleplay、课堂评价标准 | `03_classroom_practice/01_classroom_workbook_roleplay.md`、`04_case_pack/01_case_pack_appendix_all_modules.md` | v1 Roleplay 更适合课堂使用，保留其场景密度 |
| `output/lesson_01/lesson_01_homework.md` | 是 | 初版作业思路 | `02_student_materials/02_student_handout_homework.md` | 被 v2/v3 作业结构替代 |
| `output/lesson_01/lesson_01_quality_check.md` | 是 | 初版质量关注点 | `06_management/02_quality_check_teacher_usability.md` | 改为讲师可用性检查 |
| `output/lesson_01_v2/00_lesson_01_v2_readme.md` | 是 | v2 使用顺序、商业交付版意图 | `00_START_HERE_FOR_TEACHER.md` | 收束为讲师入口原则 |
| `output/lesson_01_v2/lesson_01_student_deliverables_manifest.md` | 是 | 学生交付物清单、学生资料使用顺序 | `00_START_HERE_FOR_TEACHER.md`、`02_student_materials/02_student_handout_homework.md` | 去掉零散文件引用，改为集中学生包 |
| `output/lesson_01_v2/lesson_01_teacher_ppt_outline.md` | 是 | 讲师 PPT 控场结构、时间建议、纠错点 | `01_teacher_core/02_teacher_ppt_notes_final.md` | v4 不再保留单独讲师 PPT 结构，而是转成学生页 notes |
| `output/lesson_01_v2/lesson_01_student_ppt_outline.md` | 是 | 30 页学生 PPT 结构、认同层级、核心句型 | `02_student_materials/01_student_ppt_outline_final.md` | 被 v3 34 页结构扩展，保留其清晰学习地图 |
| `output/lesson_01_v2/lesson_01_slide_script_mapping.md` | 是 | 60 分钟时间段映射 | `01_teacher_core/03_lesson_timing_and_flow.md` | 与 v3 mapping 合并 |
| `output/lesson_01_v2/lesson_01_teacher_script_v2.md` | 是 | 60 分钟讲师流程、裁剪规则、中文口播 | `01_teacher_core/01_teacher_full_script_slide_by_slide.md`、`03_lesson_timing_and_flow.md` | 从时间段稿改为逐页逐字稿 |
| `output/lesson_01_v2/lesson_01_student_handout_v2.md` | 是 | 学生学习地图、主场景、核心句型、自我检查表 | `02_student_materials/02_student_handout_homework.md` | 大量保留并与 v3 去重 |
| `output/lesson_01_v2/lesson_01_student_cheatsheet.md` | 是 | 一页式速查、NG → OK、会后邮件模板 | `02_student_materials/02_student_handout_homework.md` | 合并为会前 3 分钟速查表 |
| `output/lesson_01_v2/lesson_01_must_memorize_10_sentences.md` | 是 | 必背 10 句雏形 | `02_student_materials/02_student_handout_homework.md`、`05_appendix_assets/01_asset_appendix_phrase_dialogue_pitfalls.md` | v3 版本优先，v2 辅助 |
| `output/lesson_01_v2/lesson_01_before_meeting_quick_reference.md` | 是 | 会议前确认清单、模块确认问题、会后邮件模板 | `02_student_materials/02_student_handout_homework.md` | 与 v3 会前速查合并 |
| `output/lesson_01_v2/lesson_01_homework_v2.md` | 是 | 作业提交格式、中译日、场景表达、评分标准 | `02_student_materials/02_student_handout_homework.md` | 保留提交格式和批改重点 |
| `output/lesson_01_v2/lesson_01_japanese_naturalness_review.md` | 是 | `おっしゃる通りです` 使用边界 | `05_appendix_assets/01_asset_appendix_phrase_dialogue_pitfalls.md`、逐页稿 S-Slide 16 | 与 v3 自然度复核合并 |
| `output/lesson_01_v2/lesson_01_quality_check_v2.md` | 是 | v2 验收项 | `06_management/02_quality_check_teacher_usability.md` | 转为 v4 教师可用性检查 |
| `output/lesson_01_v3/01_lesson_01_v3_master_index.md` | 是 | v3 核心定位、硬指标 5 句、文件索引 | `00_START_HERE_FOR_TEACHER.md` | v4 继续沿用 v3 核心定位 |
| `output/lesson_01_v3/lesson_01_student_ppt_outline.md` | 是 | 34 页学生 PPT 主结构 | `02_student_materials/01_student_ppt_outline_final.md` | v4 学生 PPT 基本沿用并精简措辞 |
| `output/lesson_01_v3/lesson_01_teacher_script_v3.md` | 是 | 五动作流程、60 分钟结构、case-pack 用法 | `01_teacher_core/01_teacher_full_script_slide_by_slide.md`、`03_lesson_timing_and_flow.md` | 从时间段稿重构为逐页逐字稿 |
| `output/lesson_01_v3/lesson_01_slide_script_mapping.md` | 是 | 8 个时间段和学生 PPT 对应 | `01_teacher_core/03_lesson_timing_and_flow.md` | 直接吸收为标准 60 分钟流程 |
| `output/lesson_01_v3/lesson_01_dialogue_5_versions.md` | 是 | 标准版、慢速版、填空版、中式错误版、高级自然版 | `03_classroom_practice/01_classroom_workbook_roleplay.md`、`05_appendix_assets/01_asset_appendix_phrase_dialogue_pitfalls.md` | 完整保留核心对话资产 |
| `output/lesson_01_v3/lesson_01_hard_5_sentences.md` | 是 | 硬指标 5 句、30 秒模板 | 全部核心文件 | v4 反复强化 |
| `output/lesson_01_v3/lesson_01_must_memorize_10_sentences.md` | 是 | 必背 10 句 | 学生讲义、表达附录、PPT、逐字稿 | 完整保留 |
| `output/lesson_01_v3/lesson_01_three_level_expressions.md` | 是 | 初级/标准/高级三档表达 | 学生讲义、课堂练习、表达附录 | 完整保留并去重 |
| `output/lesson_01_v3/lesson_01_cn_jp_pitfalls_top5.md` | 是 | 中式日语 Top5 | 逐字稿、课堂练习、学生讲义、表达附录 | 完整保留 |
| `output/lesson_01_v3/lesson_01_phrase_bank_v3.md` | 是 | 七类 Phrase Bank | 表达附录 | 合并为一个附录 |
| `output/lesson_01_v3/lesson_01_workbook_v3.md` | 是 | 五个课堂练习 | `03_classroom_practice/01_classroom_workbook_roleplay.md` | 与 answer key 合并 |
| `output/lesson_01_v3/lesson_01_answer_key_v3.md` | 是 | Workbook 答案、录音参考稿 | `03_classroom_practice/01_classroom_workbook_roleplay.md` | 答案并入练习包 |
| `output/lesson_01_v3/lesson_01_homework_v3.md` | 是 | 作业 1-4、评分标准 | 学生讲义与作业包 | 与 v2 作业格式合并 |
| `output/lesson_01_v3/lesson_01_recording_homework_guide.md` | 是 | 1 分钟录音题目、自检、批改重点 | 学生讲义、逐字稿 S-Slide 33 | 完整保留 |
| `output/lesson_01_v3/lesson_01_roleplay_cards_v3.md` | 是 | FICO/MM/SD/Basis/ABAP-BTP Roleplay 卡 | 课堂练习包、case-pack 附录 | 合并为单文件 |
| `output/lesson_01_v3/lesson_01_roleplay_score_sheet.md` | 是 | Roleplay 评分表 | 课堂练习包、逐字稿 S-Slide 30 | 完整保留 |
| `output/lesson_01_v3/lesson_01_case_pack_fico.md` | 是 | FICO case-pack | case-pack 附录、课堂练习包 | 作为主案例 |
| `output/lesson_01_v3/lesson_01_case_pack_mm.md` | 是 | MM case-pack | case-pack 附录、课堂练习包 | 作为替换模块 |
| `output/lesson_01_v3/lesson_01_case_pack_sd.md` | 是 | SD case-pack | case-pack 附录、课堂练习包 | 作为替换模块 |
| `output/lesson_01_v3/lesson_01_case_pack_basis.md` | 是 | Basis case-pack | case-pack 附录、课堂练习包 | 作为替换模块 |
| `output/lesson_01_v3/lesson_01_case_pack_abap_btp.md` | 是 | ABAP-BTP case-pack | case-pack 附录、课堂练习包 | 作为替换模块 |
| `output/lesson_01_v3/lesson_01_japanese_naturalness_review.md` | 是 | 自然度复核、禁用表达 | 表达附录、逐字稿 S-Slide 15-16 | 完整吸收 |
| `output/lesson_01_v3/lesson_01_glossary_contribution.md` | 是 | 共通和模块术语 | 表达附录、case-pack 附录 | 合并为术语区 |
| `knowledge/backbone/u01-backbone.md` | 是 | 硬指标句、六步型、专业说做不到公式 | 仅吸收表达方法 | 未把 Lesson 01 改成要件定义课 |
| `knowledge/case-packs/_PACK-TEMPLATE.md` | 是 | case-pack 标准结构 | `04_case_pack/01_case_pack_appendix_all_modules.md` | 只用于统一模块附录结构 |
| `knowledge/case-packs/FICO.md` | 是 | FICO 示范包结构和场景密度 | FICO 主案例 | 与 v3 FICO 去重 |
| `knowledge/glossary/sap-jp.md` | 是 | 术语表分区思路 | 表达附录术语表 | 只吸收通用术语组织方式 |

## 3. 合并和去重说明

| 内容类别 | 处理方式 |
|---|---|
| 学生 PPT | 以 v3 34 页为主，去除任何讲师内部提示，保持与逐页稿一一对应。 |
| 讲师讲稿 | 以 v3 结构为主，吸收 v1/v2 中文口播，重写为 S-Slide 01-34 逐页逐字稿。 |
| 讲师 PPT notes | 不再保留独立 T-Slide 体系，改为围绕学生 PPT 页码的临场 notes。 |
| 学生讲义 | 合并 v1 handout、v2 handout/cheatsheet/homework、v3 handout/homework/recording guide。 |
| 课堂练习 | 合并 workbook、answer key、roleplay cards、score sheet、dialogue 5 versions。 |
| case-pack | 五个模块合并为一个附录，避免讲师打开五个文件。 |
| 表达资产 | Phrase bank、对话、三档表达、踩坑、自然度复核、术语表合并为一个附录。 |
| `おっしゃる通りです` | 不作为硬指标；只在事实或合理指摘明确成立时使用。 |

## 4. 未采用或降级内容

| 内容 | 处理 | 原因 |
|---|---|---|
| v1 中默认使用 `おっしゃる通りです。ただ、一点確認させてください` 的位置 | 改为默认 `ご意向は理解いたしました` | 避免被误解为同意照旧实现 |
| v2/v3 中大量分散文件结构 | 合并为 12 个正式文件 | 讲师备课和授课不应在 30-40 个文件间跳转 |
| v3 中复制到 Lesson 02-24 的单独规则文件 | 未单独保留 | v4 handoff 中收束为“沿用集中结构”建议 |
| v3 PPTX 生成 note | 未纳入正式资产 | 本轮只重构 Markdown 真相源，不做 PPTX 渲染 |
| 过深的 U01 要件定义方法论 | 仅吸收训练方法 | 避免 Lesson 01 跑偏成要件定义课 |
