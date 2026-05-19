# Lesson 01 v4 讲师聚焦版重构提示词

> 任务：基于 Lesson 01 的 v1/v2/v3 输出，整理为最终 v4 讲师聚焦版。  
> 核心原则：不要继续增加文件，而是把已有有效内容合并到一个集中目录。

## 1. 课程定位

课程标题：“和”文化与“礼仪至上”理念解读

本课不是普通文化课，而是 SAP 日本项目现场沟通训练课。主场景：

> 客户坚持“现行业务不能改，SAP 也要照旧处理”。SAP 顾问不能直接否定客户，需要先理解业务背景，再确认前提、范围、例外，从 SAP 标准、内部统制、会计联动、权限、测试范围等角度表达专业保留，最后说明带回确认和下一步。

核心结构：

```text
接住客户 → 理解意向 → 确认前提 → 表达专业保留 → 带回确认 → 下次说明
```

## 2. 必须读取

递归搜索并读取 Lesson 01 相关的 v1/v2/v3 文件，包括但不限于：

```text
lesson_01_ppt_outline.md
lesson_01_teacher_script.md
lesson_01_student_handout.md
lesson_01_phrases.md
lesson_01_roleplay.md
lesson_01_homework.md
lesson_01_quality_check.md
output/lesson_01_v2/
output/lesson_01_v3/
```

如果存在 `u01-backbone.md`、`_PACK-TEMPLATE.md`、`FICO.md`、`sap-jp.md`，也要读取，但只吸收教学方法，不把 Lesson 01 改成要件定义课。

## 3. 输出目录

创建：

```text
output/lesson_01_v4_teacher_focused/
```

不要覆盖 v1/v2/v3 原文件。

## 4. 最终目录结构

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

## 5. 最重要要求：逐页逐字稿

`01_teacher_core/01_teacher_full_script_slide_by_slide.md` 是最重要文件。必须按学生 PPT 页码写，每页包含：

```markdown
## S-Slide XX：页面标题

### 1. 本页目标
### 2. PPT 页面展示内容摘要
### 3. 讲师口播稿：中文
### 4. 讲师口播稿：日语示范
### 5. 讲师领读设计
### 6. 学生练习 / 提问
### 7. 学生可能回答
### 8. 讲师点评与纠错话术
### 9. 本页常见中式日语错误
### 10. 过渡到下一页的话术
### 11. 本页必须背下来的日语
### 12. 时间建议
```

日语部分必须足够老师提前朗读、熟悉、背诵。关键日语加 `/` 停顿。

## 6. 本课硬指标 5 句

必须多次训练：

```text
1. ご意向は理解いたしました。
2. 一点確認させてください。
3. 〇〇という理解でよろしいでしょうか。
4. 〇〇の観点では、影響範囲を確認する必要があると考えております。
5. 一度持ち帰って、確認のうえ次回ご説明いたします。
```

必须说明 `おっしゃる通りです` 不是万能表达。当只是理解客户意向时，优先用：

```text
ご意向は理解いたしました。
おっしゃる内容は理解いたしました。
現行業務上の必要性は理解いたしました。
業務背景は理解いたしました。
```

## 7. 质量检查

生成 `06_management/02_quality_check_teacher_usability.md`，重点检查讲师是否只需打开 2-3 个文件即可备课、是否有完整逐页逐字稿、日语口播是否足够详细、课堂练习是否集中、学生资料是否集中、case-pack 是否合并为一个附录。

完成后输出 handoff。