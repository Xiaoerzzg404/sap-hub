# Lesson 02 v4 讲师使用入口

updated_by: codex
updated_at: 2026-05-17T23:50:00+09:00

## 1. 明天要讲 Lesson 02，先看什么

上课主入口固定为 3 个文件：

1. `02_student_materials/01_student_ppt_outline_final.md`
2. `01_teacher_core/01_teacher_full_script_slide_by_slide.md`
3. `03_classroom_practice/01_classroom_workbook_roleplay.md`

本课主题是“严谨细致”与“责任担当”文化，但不要讲成普通文化课。课堂主线必须始终围绕这个 SAP 项目场景：

```text
测试中发现一个差异，但原因可能来自主数据、配置、接口或用户操作。顾问需要清楚说明自己负责什么、何时反馈。
```

## 2. 备课 30 分钟时，只看哪些文件

| 顺序 | 文件 | 看什么 |
|---:|---|---|
| 1 | 本文件 | 确认主线、硬指标 5 句、裁剪方式 |
| 2 | `02_student_materials/01_student_ppt_outline_final.md` | 快速扫 28 页学生 PPT，确认页码 |
| 3 | `01_teacher_core/01_teacher_full_script_slide_by_slide.md` | 重点朗读 S-Slide 05、06、10、13-18、20-28 |
| 4 | `03_classroom_practice/01_classroom_workbook_roleplay.md` | 预选 Ex3、Ex5、Ex8 Roleplay、课堂小测 |

30 分钟备课目标：能稳定讲完“测试差异初报”这条主线，不需要打开 case-pack 和表达附录。

## 3. 备课 2 小时时，怎么看

| 顺序 | 文件 | 使用方式 |
|---:|---|---|
| 1 | `01_teacher_core/01_teacher_full_script_slide_by_slide.md` | 完整朗读一遍，标出自己要强调的页 |
| 2 | `02_student_materials/01_student_ppt_outline_final.md` | 检查每页学生内容是否能支撑讲稿 |
| 3 | `01_teacher_core/02_teacher_ppt_notes_final.md` | 提炼临场提醒和提问点 |
| 4 | `03_classroom_practice/01_classroom_workbook_roleplay.md` | 选 2 个填空/改错 + 1 个 Roleplay |
| 5 | `04_case_pack/01_case_pack_appendix_all_modules.md` | 根据学生模块选 FICO/MM/SD/Basis/ABAP-BTP 替换素材 |
| 6 | `05_appendix_assets/01_asset_appendix_phrase_dialogue_pitfalls.md` | 备查硬指标、对话 5 版本、自然度边界 |

## 4. 上课时打开哪些文件

上课时打开：

- `02_student_materials/01_student_ppt_outline_final.md`
- `01_teacher_core/01_teacher_full_script_slide_by_slide.md`
- `03_classroom_practice/01_classroom_workbook_roleplay.md`

上课时通常不打开：

- `04_case_pack/01_case_pack_appendix_all_modules.md`
- `05_appendix_assets/01_asset_appendix_phrase_dialogue_pitfalls.md`
- `06_management/01_source_merge_log.md`
- `06_management/02_quality_check_teacher_usability.md`

这些是备课、复盘、验收和后续生成 PPTX/PDF 时使用的附录。

## 5. Lesson 02 的 60 分钟主线

```text
测试差异出现
↓
不提前断定原因
↓
说明现象和已确认范围
↓
说明未确认事项和担当范围
↓
给下一次报告期限
↓
录 1 分钟问题初报
```

简化为：

```text
事实边界 → 担当范围 → 未确认管理 → 下一次期限
```

## 6. 本课硬指标 5 句

请讲师先能带停顿读出：

1. 本件については、/ 私の方で確認いたします。
2. 明日17時までに / 一次回答を行う予定です。
3. 現時点では、/ 再現条件まで / 確認できております。
4. 未確認事項として、/ 課題管理表で管理いたします。
5. 担当範囲としては、/ 設定確認とテスト証跡の整理まで / 対応いたします。

## 7. 时间不足时如何裁剪

必须保留：

- S-Slide 05：硬指标 5 句
- S-Slide 06：主场景：测试差异初报
- S-Slide 10：五步汇报结构
- S-Slide 13-18：四个核心句型和期限边界
- S-Slide 20-24：标准对话、拆解、慢速领读、填空、中式错误
- S-Slide 26-28：模块替换、Roleplay、录音作业

可压缩：

- S-Slide 04 学生交付物：30 秒扫过
- S-Slide 07-09 文化说明：合并为“证据、记录、担当边界”3 分钟说明
- S-Slide 25 高级自然版：低水平班只读不展开

## 8. 学生水平较低时如何调整

- 只要求掌握硬指标 5 句，不要求现场自由发挥。
- Roleplay 允许看稿，客户追问只问一次。
- 模块替换只做 FICO 或学生自己模块，不展开 5 个模块。
- 录音作业允许 40 秒，但必须包含：現象、確認済み、未確認、期限。
- 讲师纠错只抓 3 个：提前断定原因、没有担当范围、没有期限。

## 9. 学生都是高级顾问时如何加深

- 要求学生区分“最终解决承诺”和“一次回答承诺”。
- 要求说明跨团队确认对象：CO、开发、Basis、业务用户、外部系统。
- Roleplay 中客户连续追问“今日中に直せますか”，学生必须守住边界。
- 课后录音必须包含本模块对象、证迹、课题管理表、下一次会议输出物。

## 10. 讲师当天授课心法

这节课的核心不是告诉学生“日本人认真负责”，而是让学生在项目压力下不乱断定、不乱承诺、不模糊责任。

讲师要不断把学生拉回 4 个问题：

1. 到哪里为止确认了？
2. 还没确认什么？
3. 你负责到哪里？
4. 什么时候给下一次反馈？

主案例建议使用 FICO 测试差异，模块替换再覆盖 MM、SD、Basis、ABAP-BTP。60 分钟课中最多重点讲 1 个主模块 + 1 个替换模块。
