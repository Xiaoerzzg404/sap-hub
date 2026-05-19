# Codex 高效完成 24 课内容生成指南 V4

## 1. 最重要结论

不要让 Codex 一次性生成全部 24 课。  
也不要让每课回到 30-40 个 Markdown 文件的分散状态。

正确方法是：

```text
先固定 Lesson 01 v4 模板
再单独生成 Lesson 02
Lesson 02 人工验收通过后
再按批次生成 Lesson 03-24
每批都做 QA
最后再做课程总索引和总审查
```

## 2. 推荐执行流程

### Phase 0：冻结 Lesson 01 v4 模板

确认 Lesson 01 v4 目录中以下 3 个文件好用：

```text
00_START_HERE_FOR_TEACHER.md
01_teacher_core/01_teacher_full_script_slide_by_slide.md
02_student_materials/01_student_ppt_outline_final.md
```

如果这 3 个文件不好用，不要继续做 23 课。

### Phase 1：生成 Lesson 02

给 Codex 执行：

```text
prompts_v4/single_lessons/lesson_02_v4_codex_prompt.md
```

人工重点检查：

1. 逐字稿是否足够详细；
2. 日语口播是否能直接朗读；
3. 学生 PPT 是否和逐字稿对应；
4. 课堂练习是否集中；
5. 是否只生成 10-12 个文件；
6. 是否保持 SAP 项目现场感。

### Phase 2：小批量生成 Lesson 03-06

如果 Lesson 02 通过，再执行：

```text
prompts_v4/batch/batch_02_06_v4_prompt.md
```

注意：如果 Lesson 02 已经生成，批处理可跳过 Lesson 02 或只做检查。

### Phase 3：生成 Lesson 07-12

执行：

```text
prompts_v4/batch/batch_07_12_v4_prompt.md
```

这批涉及市场、趋势、系统、数据、安全。注意不要编造实时市场数据。

### Phase 4：生成 Lesson 13-18

执行：

```text
prompts_v4/batch/batch_13_18_v4_prompt.md
```

这批是核心项目实战课，重点检查逐字稿与 Roleplay。

### Phase 5：生成 Lesson 19-24

执行：

```text
prompts_v4/batch/batch_19_24_v4_prompt.md
```

这批是上线、运维、邮件、协作、问题应对，重点检查日语自然度和紧急场景表达。

### Phase 6：生成总索引

全部课程完成后，让 Codex 生成：

```text
output/00_course_index_v4.md
output/00_teacher_usage_guide_v4.md
output/00_all_lessons_quality_report_v4.md
output/00_student_deliverables_index_v4.md
```

## 3. 每课人工验收只看 5 个点

不要一开始就审所有文件。先看：

1. `00_START_HERE_FOR_TEACHER.md`
2. `01_teacher_core/01_teacher_full_script_slide_by_slide.md`
3. `02_student_materials/01_student_ppt_outline_final.md`
4. `03_classroom_practice/01_classroom_workbook_roleplay.md`
5. `06_management/02_quality_check_teacher_usability.md`

这 5 个过关后，再看学生讲义和附录。

## 4. 逐字稿验收标准

逐字稿必须能回答：

- 我能不能明天拿它上课？
- 我能不能提前朗读三遍？
- 日语部分能不能直接照读？
- 每页有没有过渡语？
- 每页有没有学生练习？
- 每页有没有纠错话术？
- 60 分钟是否讲得完？

如果逐字稿只是提纲，必须退回 Codex 重做。

## 5. 批量生成时最容易出的问题

| 问题 | 处理 |
|---|---|
| 每课又生成 30+ 文件 | 立即停止，要求回到 V4 集中结构 |
| 逐字稿太短 | 要求逐页补充中文口播、日语示范、带读、纠错 |
| PPT 和逐字稿不对应 | 要求按学生 PPT 页码重排 |
| 日语太中式 | 要求做 Japanese naturalness review |
| 太像 SAP 配置课 | 要求回到“项目日语表达训练” |
| 太像普通商务日语 | 要求加入 SAP 主场景、模块对象、交付物 |
| case-pack 太长 | 要求压缩为替换素材，不要抢主课 |

## 6. 最推荐的 Codex 使用方式

每次只给 Codex 一个明确目标：

```text
先生成 Lesson 02 v4。
不要做 Lesson 03。
不要生成额外文件。
完成后先报告逐字稿页数、PPT页数、文件清单和 QA。
```

这样比一次给它 23 课更稳定。

## 7. 最终目标

24 课完成后，你应该得到：

```text
output/
├── lesson_01_v4_teacher_focused/
├── lesson_02_v4_teacher_focused/
...
├── lesson_24_v4_teacher_focused/
├── 00_course_index_v4.md
├── 00_teacher_usage_guide_v4.md
├── 00_student_deliverables_index_v4.md
└── 00_all_lessons_quality_report_v4.md
```

这个结构才能真正支持正式授课。
