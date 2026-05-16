# Lesson 01 v3 Quality Check

updated_by: codex
updated_at: 2026-05-16T23:35:00+09:00

| 检查项 | 结果 | 证据 | 如果未通过，修正文件 |
|---|---|---|---|
| 是否生成全部必需 Markdown 文件 | pass | `lesson_01_v3/` 生成 36 个必需 Markdown 文件，另有 PPTX note | 缺失时补对应文件 |
| 是否明确学生交付物 | pass | `lesson_01_student_deliverables_manifest.md` 列出 16 项交付物 | manifest |
| 是否生成学生版 PPT outline | pass | `lesson_01_student_ppt_outline.md`，S-Slide 01-34 | student PPT |
| 是否生成讲师版 PPT outline | pass | `lesson_01_teacher_ppt_outline.md`，T-Slide 01-24 | teacher PPT |
| 学生版 PPT 是否去除讲师内部提示 | pass | 学生版每页仅含页面展示、学习重点、例句、练习、复习提示 | student PPT |
| 讲师版 PPT 是否包含时间建议和控场提示 | pass | 讲师版每页含时间建议、是否可跳过、提问、点评 | teacher PPT |
| Teacher Script 是否和 PPT 页码对应 | pass | `lesson_01_teacher_script_v3.md` 开头表格和每段对应 PPT | teacher script |
| 是否生成 slide-script mapping | pass | `lesson_01_slide_script_mapping.md` 覆盖 8 个时间段 | mapping |
| 是否新增硬指标 5 句 | pass | `lesson_01_hard_5_sentences.md`，且写入 PPT/讲义/作业/录音 | hard 5 |
| 是否体现听读换演录五动作 | pass | `lesson_01_training_flow_listen_read_replace_act_record.md` 与 mapping 均体现 | training flow |
| 是否新增对话 5 版本 | pass | `lesson_01_dialogue_5_versions.md` 含标准、慢速、填空、错误、高级 | dialogue |
| 是否新增三档表达 | pass | `lesson_01_three_level_expressions.md` 覆盖 8 个功能 | three levels |
| 是否新增中式日语踩坑 Top5 | pass | `lesson_01_cn_jp_pitfalls_top5.md` 覆盖 5 条 | pitfalls |
| 是否新增 1 分钟录音作业 | pass | `lesson_01_recording_homework_guide.md` 与 `lesson_01_homework_v3.md` | recording/homework |
| 是否新增 case-pack 机制 | pass | case-pack index、template、5 个模块包 | case-pack files |
| 是否覆盖 FICO/MM/SD/Basis/ABAP-BTP | pass | 5 个具体 case-pack 均存在且填满 | module packs |
| PPT 作业说明是否和 homework 一致 | pass | S-Slide 33、T-Slide 18-19 与 homework v3 一致 | PPT/homework |
| 是否完成日语自然度复核 | pass | `lesson_01_japanese_naturalness_review.md` | review |
| 是否仍控制在 60 分钟 | pass | mapping 和 teacher script 均按 60 分钟设计 | mapping/script |
| 是否适合中国 SAP 顾问 | pass | 多模块 SAP 对象、项目对话、Roleplay、录音作业齐全 | 全包 |
| 是否保持 Lesson 01 主题不跑偏 | pass | 主场景始终是客户坚持现行流程与“和”文化边界 | 全包 |
| 是否可作为 Lesson 02-24 模板 | review | 结构可复制，但应先由用户抽查 5 个关键文件 | copy rules |

## 仍需人工确认

1. 学生版 PPT 的页数和文字密度是否适合真实授课。
2. case-pack 的模块深度是否满足目标学员。
3. 硬指标 5 句是否作为商业宣传中的“本课达标线”。
4. 是否需要下一步生成 PPTX 并做视觉 QA。

## 不建议直接批量生成 Lesson 02-24 的原因

Lesson 01 v3 已具备模板条件，但仍需用户确认风格与粒度。建议先做 Lesson 02 一课样板，而不是一次生成 23 课。
