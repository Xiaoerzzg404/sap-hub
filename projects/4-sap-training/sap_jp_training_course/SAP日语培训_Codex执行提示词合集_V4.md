# SAP日语培训｜Codex执行提示词合集 V4

> V4 目标：以 Lesson 01 v4 讲师聚焦版为模板，生成 24 课正式可授课资料。  
> 最大变化：不再让每课生成 30-40 个分散文件，而是每课生成一个集中成果包。

---

## Prompt 00：V4 总控原则

```text
你是 SAP 顾问日语培训课程制作 Agent。

请严格按照 Lesson 01 v4 teacher-focused 结构生成课程资料。

核心原则：
1. 课程不是普通日语课，而是 SAP 项目现场日语训练课。
2. 每课必须有学生 PPT 和讲师逐页逐字稿。
3. 逐字稿是最重要成果，必须足够讲师朗读、熟悉、背诵。
4. 每课最终成果物必须集中在一个 `lesson_##_v4_teacher_focused/` 文件夹。
5. 不要生成 30-40 个分散 Markdown 文件。
6. 课堂练习集中到一个文件。
7. 学生讲义与作业集中到一个文件。
8. case-pack 与表达资产作为附录。
9. 每课必须有 1 分钟录音作业。
10. 每课必须有讲师可用性质量检查。
```

---

## Prompt 01：开工总提示词

请使用：

```text
04_Codex开工总提示词_V4.md
```

---

## Prompt 02：单课提示词

单课提示词目录：

```text
prompts_v4/single_lessons/
```

包含：

```text
lesson_01_v4_codex_prompt.md
lesson_02_v4_codex_prompt.md
...
lesson_24_v4_codex_prompt.md
```

推荐执行顺序：

```text
1. 确认 Lesson 01 v4 已经完成
2. 单独执行 Lesson 02
3. 人工验收 Lesson 02
4. 再按批次执行 Lesson 03-24
```

---

## Prompt 03：批量执行提示词

批量执行提示词目录：

```text
prompts_v4/batch/
```

包含：

```text
batch_02_06_v4_prompt.md
batch_07_12_v4_prompt.md
batch_13_18_v4_prompt.md
batch_19_24_v4_prompt.md
```

不要从一开始就执行全部批次。先完成 Lesson 02 验收。

---

## Prompt 04：质量审查提示词

```text
你是 SAP 顾问日语培训课程审查专家、日语自然度审查专家、讲师可用性审查专家。

请审查指定 lesson_##_v4_teacher_focused 目录。

重点不是文件是否齐，而是讲师是否真的能用。

必须检查：
1. 是否所有文件集中在一个 lesson 文件夹下；
2. 是否没有生成 30+ 分散文件；
3. 是否有 00_START_HERE_FOR_TEACHER.md；
4. 是否有逐页逐字稿；
5. 逐字稿是否按学生 PPT 页码编写；
6. 逐字稿是否足够支撑 60 分钟；
7. 日语口播是否足够详细；
8. 核心日语是否带 `/` 停顿；
9. 每页是否有带读设计；
10. 每页是否有学生练习；
11. 每页是否有讲师点评和纠错话术；
12. 学生 PPT 是否与逐字稿对应；
13. 学生 PPT 是否去除讲师内部提示；
14. 课堂练习是否集中在一个文件；
15. 学生资料是否集中在一个文件；
16. case-pack 是否合并为一个附录；
17. 表达资产是否合并为一个附录；
18. 是否保持 SAP 项目现场日语定位；
19. 是否避免普通商务日语化；
20. 是否适合中国 SAP 顾问。

请输出：
- `质量审查报告.md`
- `必须修改问题清单.md`
- `建议优化问题清单.md`
- `给Codex下一轮修复提示词.md`
```

---

## Prompt 05：最终总索引生成提示词

```text
当 24 课全部完成后，请生成课程总索引。

请读取：
output/lesson_01_v4_teacher_focused/
...
output/lesson_24_v4_teacher_focused/

输出：
1. output/00_course_index_v4.md
2. output/00_teacher_usage_guide_v4.md
3. output/00_student_deliverables_index_v4.md
4. output/00_all_lessons_quality_report_v4.md

要求：
- 列出每课主题、目录、主场景、讲师入口、学生交付物；
- 说明讲师如何备课；
- 说明如何用学生 PPT + 逐页逐字稿授课；
- 标出哪些课程适合公开课、正式课、补课、进阶训练；
- 汇总所有仍需人工确认的问题。
```

---

## Prompt 06：视觉与销售资料仍沿用 V3，但需 V4 化

如果继续生成招生页、公开课、视觉海报、Obsidian 知识库，可以参考 V3 的 Prompt 03-08。  
但必须补充：

```text
所有销售文案必须基于 V4 课程结构：
- 强调每课都有学生 PPT、逐字稿、课堂练习、录音作业；
- 强调不是普通日语课；
- 强调学员必须开口训练；
- 不承诺就业、包项目、保证面试通过；
- 不虚构市场数据。
```

---

## 推荐执行命令顺序

```text
1. 执行 prompts_v4/single_lessons/lesson_02_v4_codex_prompt.md
2. 审查 output/lesson_02_v4_teacher_focused/
3. 通过后执行 prompts_v4/batch/batch_02_06_v4_prompt.md
4. 审查 Lesson 02-06
5. 执行 batch_07_12
6. 执行 batch_13_18
7. 执行 batch_19_24
8. 生成总索引与总 QA
```
