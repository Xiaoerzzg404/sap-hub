# Lesson 01 v2 输出说明

updated_by: codex
updated_at: 2026-05-16T23:02:00+09:00

## 本次改修目标

Lesson 01 v2 的目标是把第一版“讲师备课包”升级为可复制的商业样板课。核心改修方向如下：

1. 明确学生上完课后拿到什么，而不是只给讲师资料。
2. 拆分讲师版 PPT 与学生版 PPT，避免学生资料混入讲师内部提示。
3. 建立 PPT 页码、讲课时间、逐字稿段落之间的强对应关系。
4. 统一 PPT 作业说明与 `lesson_01_homework_v2.md` 的完整作业结构。
5. 二次复核日语自然度，尤其控制 `おっしゃる通りです` 的使用边界。

本课仍保持 60 分钟标准课，不继续生成 Lesson 02-24。

## v2 文件清单

| 文件 | 作用 |
|---|---|
| `00_lesson_01_v2_readme.md` | v2 输出总说明。 |
| `lesson_01_student_deliverables_manifest.md` | 学生交付物清单，说明每份资料如何用于项目现场。 |
| `lesson_01_teacher_ppt_outline.md` | 讲师版 PPT 大纲，包含控场、提问、纠错、时间和可跳过信息。 |
| `lesson_01_student_ppt_outline.md` | 学生版 PPT 大纲，去除讲师内部提示，可作为课后复习材料。 |
| `lesson_01_slide_script_mapping.md` | PPT 页码与逐字稿时间段映射。 |
| `lesson_01_teacher_script_v2.md` | 讲师逐字稿 v2，绑定 PPT 页码并加入裁剪规则。 |
| `lesson_01_student_handout_v2.md` | 学生讲义 v2，强化独立复习、自我检查和完整对话拆解。 |
| `lesson_01_student_cheatsheet.md` | 一页式速查表，用于会议前 3 分钟复习。 |
| `lesson_01_must_memorize_10_sentences.md` | 本课必背 10 句，覆盖会议关键功能。 |
| `lesson_01_before_meeting_quick_reference.md` | 日本 SAP 项目会议前速查表，按模块给出确认问题。 |
| `lesson_01_homework_v2.md` | 作业 v2，含提交格式、参考答案、教师批改重点和优劣示例。 |
| `lesson_01_japanese_naturalness_review.md` | 日语自然度复核，明确替换建议和使用边界。 |
| `lesson_01_quality_check_v2.md` | v2 最终质量检查。 |

## 和 v1 的主要差异

| 维度 | v1 | v2 |
|---|---|---|
| PPT | 单一混合型 PPT outline | 拆分为讲师版 24 页、学生版 30 页 |
| 学生交付物 | 有 handout / homework / phrase bank，但交付物说明不清 | 新增交付物清单、速查表、必背 10 句、会议前速查 |
| Teacher Script | 按时间段组织 | 增加 PPT 页码绑定、控场规则、时间不足裁剪规则 |
| 作业 | 题型完整 | 增加提交格式、教师批改重点、优秀/不合格答案示例 |
| 日语自然度 | 基础可用 | 新增自然度复核，减少过度使用 `おっしゃる通りです` |
| 模板价值 | 可授课 | 可复制到后续 24 课的商业样板 |

## 讲师如何使用

1. 上课前先读 `lesson_01_slide_script_mapping.md`，确认 60 分钟节奏。
2. 用 `lesson_01_teacher_ppt_outline.md` 制作讲师版 PPT 或授课提词。
3. 上课时打开 `lesson_01_teacher_script_v2.md`，按对应 T-Slide / S-Slide 推进。
4. 发给学生的资料优先使用：
   - `lesson_01_student_ppt_outline.md`
   - `lesson_01_student_handout_v2.md`
   - `lesson_01_student_cheatsheet.md`
   - `lesson_01_must_memorize_10_sentences.md`
   - `lesson_01_before_meeting_quick_reference.md`
   - `lesson_01_homework_v2.md`
5. 如果课堂时间不足，按 teacher script v2 末尾的裁剪规则执行。

## 学生将获得什么

学生上完 Lesson 01 后，不只是听懂“和”文化，而是拿到一套能用于项目现场的表达资产：

- 一套学生版 PPT 学习地图；
- 一份课后可复习的 handout；
- 一页式会议前速查表；
- 必背 10 句；
- 客户坚持现行流程时的回应模板；
- 多模块确认问题库；
- 完整 homework 与评分标准；
- 自我检查表。

## 后续 Lesson 02-24 如何复制这个模板

后续每课建议复制 v2 的产品结构：

1. 每课先定义“项目现场核心痛点”。
2. 每课拆分讲师版 PPT 和学生版 PPT。
3. 每课必须有 slide-script mapping。
4. 每课必须给学生一页式速查表和必背句。
5. 每课 homework 必须和 PPT 末页一致。
6. 每课做日语自然度复核，特别检查是否直译、过度敬语、承诺过快。

复制前应先确认 Lesson 01 v2 的商业交付风格、文件粒度和日语语气。
