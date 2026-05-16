# Lesson 01 v4 讲师聚焦版交接说明

updated_by: codex
updated_at: 2026-05-17T00:40:00+09:00

## 1. 本次为什么要从 v3 重构到 v4

v3 已经生成了大量商业样板课资产，但文件接近 40 个，讲师备课、上课和查资料时容易被文件数量拖住。v4 的目标不是扩展内容，而是把 v1/v2/v3 中有效内容合并、去重、重构为讲师真正能用的集中成果包。

核心改动：

- 从“资产很多”改成“入口很少”；
- 从“讲师需要找文件”改成“讲师主要看学生 PPT + 逐页逐字稿”；
- 从“练习、作业、case-pack 分散”改成“各自集中为一个包”；
- 从“时间段讲稿”改成“S-Slide 01-34 逐页逐字稿”。

## 2. v4 最终目录结构

```text
output/lesson_01_v4_teacher_focused/
├── 00_START_HERE_FOR_TEACHER.md
├── 01_teacher_core/
│   ├── 01_teacher_full_script_slide_by_slide.md
│   ├── 02_teacher_ppt_notes_final.md
│   └── 03_lesson_timing_and_flow.md
├── 02_student_materials/
│   ├── 01_student_ppt_outline_final.md
│   └── 02_student_handout_homework.md
├── 03_classroom_practice/
│   └── 01_classroom_workbook_roleplay.md
├── 04_case_pack/
│   └── 01_case_pack_appendix_all_modules.md
├── 05_appendix_assets/
│   └── 01_asset_appendix_phrase_dialogue_pitfalls.md
├── 06_management/
│   ├── 01_source_merge_log.md
│   └── 02_quality_check_teacher_usability.md
└── handoff_lesson_01_v4_teacher_focused.md
```

正式文件数量：12 个。

## 3. 讲师明天要上课时应该打开哪些文件

上课主入口：

1. `02_student_materials/01_student_ppt_outline_final.md`
2. `01_teacher_core/01_teacher_full_script_slide_by_slide.md`
3. `03_classroom_practice/01_classroom_workbook_roleplay.md`

备课先读：

1. `00_START_HERE_FOR_TEACHER.md`
2. `01_teacher_core/01_teacher_full_script_slide_by_slide.md`
3. `02_student_materials/01_student_ppt_outline_final.md`

不要上课时打开 30 多个文件。

## 4. 逐字稿增强点

- 按学生 PPT 的 S-Slide 01-34 一页一页写。
- 每页包含 12 个固定部分：目标、展示摘要、中文口播、日语示范、领读、练习、可能回答、点评、错误、过渡、必背日语、时间建议。
- 日语关键句加 `/` 停顿，方便讲师带读。
- 明确强化硬指标 5 句。
- 明确讲解 `おっしゃる通りです` 的使用边界。
- Roleplay、纠错、小测、作业布置都有日语说明。

## 5. 学生 PPT 与逐字稿对应情况

学生 PPT 最终版为 S-Slide 01-34。逐字稿同样为 S-Slide 01-34，页码一一对应。

学生 PPT 只保留学生应看到的内容，没有讲师内部提示。

## 6. 课堂练习集中情况

课堂练习统一放入：

```text
03_classroom_practice/01_classroom_workbook_roleplay.md
```

已合并：

- 听力理解；
- 慢速跟读；
- 硬指标填空；
- 句型替换；
- 中式错误找错；
- 三档表达替换；
- 模块替换；
- FICO/MM/SD/Basis/ABAP-BTP Roleplay；
- Roleplay 评分表；
- 课堂小测；
- 参考答案。

## 7. 学生交付物集中情况

学生课后资料统一放入：

```text
02_student_materials/02_student_handout_homework.md
```

已合并：

- 学生讲义；
- 硬指标 5 句；
- 必背 10 句；
- 核心词汇；
- 核心句型；
- 三档表达；
- 中式日语 Top5；
- 会前 3 分钟速查表；
- 课堂对话复习；
- 作业 1-4；
- 1 分钟录音作业；
- 作业提交格式；
- 自我检查表。

## 8. case-pack 集中情况

五个模块 case-pack 已合并为：

```text
04_case_pack/01_case_pack_appendix_all_modules.md
```

覆盖：

- FICO；
- MM；
- SD；
- Basis；
- ABAP-BTP。

该文件是附录，不是主课。60 分钟课中建议只重点讲 FICO + 一个替换模块。

## 9. v1/v2/v3 内容吸收说明

详见：

```text
06_management/01_source_merge_log.md
```

总体吸收方式：

- v1：保留自然中文口播、真实项目场景、Roleplay 的课堂可用性；
- v2：保留学生资料结构、作业提交格式、会前速查、自然度边界；
- v3：保留 34 页学生 PPT、硬指标 5 句、五动作训练、对话 5 版本、case-pack、录音作业、质量检查思路。

## 10. 仍需人工确认事项

1. 逐字稿口吻是否符合用户真实授课风格。
2. 学生 PPT 34 页是否适合最终 PPTX 节奏。
3. FICO 主案例是否固定为商业样板课主案例。
4. 是否需要日语母语者复核。
5. 是否开始生成 PPTX / PDF / DOCX。

## 11. 是否建议基于 v4 开始做 Lesson 02

建议先基于 v4 做 Lesson 02 一课样板，不建议立刻一次性生成 Lesson 02-24。

明确建议：

```text
不要再让每课生成 30-40 个 Markdown 文件。
Lesson 02-24 应优先沿用 v4 的集中结构。
```

Lesson 02 可沿用 v4 的 12 文件结构，但每课应重新设计：

- 主场景；
- 硬指标句；
- 对话 5 版本；
- 课堂练习；
- case-pack；
- 作业与录音题目。
