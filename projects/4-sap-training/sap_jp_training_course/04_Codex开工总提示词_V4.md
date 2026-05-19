# Codex 开工总提示词 V4：SAP 顾问日语培训 24 课 teacher-focused 生成任务

你现在是我的「SAP 顾问日语培训课程制作 Agent」。

## 一、项目背景

我要做一套面向中国 SAP 行业顾问的日本项目日语实战课程。

课程对象：

- 有 SAP 项目经验的中国顾问；
- 可能来自 FI、CO、SD、MM、PP、AA、Basis、ABAP、BTP 等模块；
- 有一定日语基础，但无法稳定用日语完成项目沟通；
- 希望进入日本 SAP 项目、对日项目或日企项目；
- 他们不是普通日语学习者，而是 SAP 项目现场的实际工作者。

课程核心定位：

> 训练 SAP 顾问在日本项目现场能马上用起来的日语表达、会议沟通、需求调研、配置说明、测试说明、问题汇报、邮件会议纪要、职场礼仪与项目协作能力。

## 二、V4 的最大变化

不要继续沿用旧版“每课 4 个文件”或“每课 30-40 个文件”的模式。

本项目已经通过 Lesson 01 v4 确定新的单课结构：

```text
资料可以多，但讲师入口必须少。
讲师主要对着学生 PPT 和逐页逐字稿讲课。
课堂练习集中到一个文件。
学生资料集中到一个文件。
case-pack 和表达资产作为附录。
```

## 三、请先读取这些文件

请优先读取当前工作目录下的：

```text
00_课程总设计_V4.md
01_24课详细纲要与Prompt_V4.md
02_24课Codex提示词索引_V4.md
03_24课课程总览表_V4.md
SAP日语培训_Codex执行提示词合集_V4.md
prompts_v4/single_lessons/
templates_v4/lesson_v4_teacher_focused_template.md
```

如果本地还有旧文件，也可以读取作为参考：

```text
00_课程总设计.md
01_24课详细纲要与Prompt.md
02_24课Codex提示词索引.md
03_24课课程总览表.md
04_Codex开工总提示词.md
SAP日语培训_Codex执行提示词合集_V3.md
output/lesson_01_v4_teacher_focused/
```

注意：旧文件只作为来源。最终必须按 V4 结构输出。

## 四、总目标

生成 24 课完整课程资产。每课输出：

```text
output/lesson_##_v4_teacher_focused/
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
└── handoff_lesson_##_v4_teacher_focused.md
```

## 五、每课最重要成果：逐页逐字稿

每课最重要文件是：

```text
01_teacher_core/01_teacher_full_script_slide_by_slide.md
```

必须做到：

- 按学生 PPT 页码写；
- 每页有中文口播；
- 每页有日语示范；
- 核心日语加 `/` 停顿；
- 每页有领读设计；
- 每页有学生可能回答；
- 每页有讲师点评与纠错话术；
- 老师可以提前朗读、熟悉、背诵；
- 足够支撑 60 分钟授课。

## 六、执行批次

不要一次性生成 24 课。按批次执行：

```text
第0批：确认 Lesson 01 v4 模板已经可用
第1批：Lesson 02
第2批：Lesson 03-06
第3批：Lesson 07-12
第4批：Lesson 13-18
第5批：Lesson 19-24
第6批：生成总索引、讲师使用指南、课程质量总审查
```

推荐先单独生成 Lesson 02，人工验收后再批量生成。

## 七、生成单课的方式

每课请读取对应提示词：

```text
prompts_v4/single_lessons/lesson_##_v4_codex_prompt.md
```

然后按提示词执行。

## 八、每批生成后必须做 QA

每课必须生成：

```text
06_management/02_quality_check_teacher_usability.md
```

每批结束后，还要生成：

```text
output/batch_##_quality_report.md
```

检查：

- 是否避免 30+ 文件分散；
- 是否有完整逐页逐字稿；
- 学生 PPT 是否与逐字稿对应；
- 课堂练习是否集中；
- 学生资料是否集中；
- 日语是否自然；
- SAP 项目场景是否真实；
- 是否适合中国 SAP 顾问；
- 是否可作为正式授课资料。

## 九、严禁事项

1. 不要生成普通日语课；
2. 不要生成 SAP 配置培训课；
3. 不要承诺就业、包项目、保证面试通过；
4. 不要编造市场数据；
5. 不要让单课文件再次分散成 30-40 个；
6. 不要只在聊天窗口输出，必须写入文件；
7. 不要删除旧文件；
8. 不要覆盖 Lesson 01 v4，除非明确要求。

## 十、现在开始

第一步：读取 V4 课程设计与提示词索引。  
第二步：确认 Lesson 01 v4 模板。  
第三步：按 `prompts_v4/single_lessons/lesson_02_v4_codex_prompt.md` 生成 Lesson 02 v4。  
第四步：生成质量检查和 handoff。  
第五步：等待人工确认后，再继续批量生成。
