# Lesson 01 v4 讲师可用性质量检查

updated_by: codex
updated_at: 2026-05-17T00:40:00+09:00

| 检查项 | 结果 | 证据 | 需要修改时的建议 |
|---|---|---|---|
| 是否所有最终成果集中到 v4 文件夹 | pass | 所有正式成果位于 `output/lesson_01_v4_teacher_focused/` | 如需新增文件，必须先写入 handoff 原因 |
| 是否未修改 v1/v2/v3 原文件 | pass | v4 新增目录，不覆盖 `lesson_01/`、`lesson_01_v2/`、`lesson_01_v3/` | 若发现 diff，撤回对旧版本修改 |
| 是否没有继续生成 30+ 分散文件 | pass | v4 正式文件 12 个 | 后续 Lesson 02-24 沿用集中结构 |
| 讲师是否只需打开 2-3 个文件即可备课 | pass | `00_START_HERE_FOR_TEACHER.md` 明确上课主入口为学生 PPT、逐页稿、练习包 | 若讲师仍需查找，继续合并附录 |
| 是否有完整逐页逐字稿 | pass | `01_teacher_full_script_slide_by_slide.md` 覆盖 S-Slide 01-34 | 讲师试讲后可补更自然个人口吻 |
| 逐字稿是否按学生 PPT 页码写 | pass | 每页使用 `## S-Slide XX`，与学生 PPT 34 页对应 | 若 PPT 页数调整，必须同步改逐字稿 |
| 逐字稿是否足够讲 60 分钟 | pass | 每页包含目标、中文口播、日语示范、领读、练习、点评、过渡和时间建议 | 实际试讲后可微调时间 |
| 日语口播是否足够详细 | pass | 核心页包含完整日语示范、Roleplay 日语说明、作业布置日语 | 可请母语者二次润色 |
| 核心日语是否带停顿 | pass | 硬指标 5 句和慢速对话均带 `/` 停顿 | 如生成 PPTX，应保留停顿版本在讲师备注 |
| 每页是否有带读设计 | pass | 逐字稿每页均含“讲师领读设计” | 试讲后可删减非核心页带读 |
| 每页是否有讲师点评和纠错话术 | pass | 逐字稿每页均含点评与纠错话术 | 高级班可追加更细的点评 |
| 学生 PPT 是否与逐字稿对应 | pass | 学生 PPT 和逐字稿均为 S-Slide 01-34 | 任何页码调整都必须成对修改 |
| 学生 PPT 是否去除讲师内部提示 | pass | 学生 PPT 只保留页面展示、学习重点、SAP 例句、学生练习 | 验收时继续 grep 内部提示词 |
| 课堂练习是否集中在一个文件 | pass | `03_classroom_practice/01_classroom_workbook_roleplay.md` 合并练习、答案、Roleplay、评分表 | 后续不要再拆 workbook/answer key |
| 学生资料是否集中在一个文件 | pass | `02_student_materials/02_student_handout_homework.md` 合并讲义、速查、作业、录音、自检 | 若制作 PDF，可由此文件生成 |
| case-pack 是否合并为一个附录 | pass | `04_case_pack/01_case_pack_appendix_all_modules.md` 覆盖 FICO/MM/SD/Basis/ABAP-BTP | 课堂只选 1-2 个模块 |
| 表达资产是否合并为一个附录 | pass | `05_appendix_assets/01_asset_appendix_phrase_dialogue_pitfalls.md` 合并 phrase/dialogue/pitfalls/review/glossary | 后续 Lesson 可复用此结构 |
| 是否保留 v1/v2/v3 中有效内容 | pass | `01_source_merge_log.md` 逐项记录吸收内容 | 若用户指出遗漏，可回补到对应集中包 |
| 是否去重 | pass | 同类内容集中到学生材料、练习包、case-pack、表达附录，不重复保留小文件 | 试讲后可继续压缩重复句 |
| 是否保持 Lesson 01 主题不跑偏 | pass | 主线始终是客户坚持现行流程时的表达训练 | 避免扩展成配置课或要件定义课 |
| 是否突出“学生 PPT + 逐字稿”作为授课核心 | pass | 顶层入口、handoff、逐字稿均反复说明主入口 | 后续课程也应保持此结构 |
| 是否适合讲师提前朗读、熟悉、背诵 | pass | 逐字稿包含中文口播和日语示范，支持提前朗读 | 建议真实试讲一次后做 v4.1 |
| 是否适合后续作为 Lesson 02-24 模板 | review | 文件结构适合复制，但 Lesson 02 主题和练习资产需重新设计 | 建议先做 Lesson 02 v4 小样，不要一次性生成 23 课 |

## 人工确认项

1. 逐页逐字稿是否符合用户个人真实授课口吻。
2. 学生 PPT 34 页是否适合最终 PPTX 视觉节奏。
3. FICO 主案例是否作为商业样板课主案例固定下来。
4. 是否需要日本母语者复核日语自然度。
5. 是否进入 PPTX / PDF / DOCX 制作。
