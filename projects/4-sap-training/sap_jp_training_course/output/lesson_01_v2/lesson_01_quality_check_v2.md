# Lesson 01 v2 Quality Check

updated_by: codex
updated_at: 2026-05-16T23:02:00+09:00

| 检查项 | 结果 | 说明 |
|---|---|---|
| 是否明确学生交付物 | pass | `lesson_01_student_deliverables_manifest.md` 列出 10 类学生交付物和使用方式。 |
| 是否生成学生版 PPT outline | pass | `lesson_01_student_ppt_outline.md` 按 S-Slide 01-30 组织。 |
| 是否生成讲师版 PPT outline | pass | `lesson_01_teacher_ppt_outline.md` 按 T-Slide 01-24 组织。 |
| 学生版 PPT 是否去除了讲师内部提示 | pass | 学生版只保留页面展示内容、学习重点、SAP 例句、学生练习、复习提示。 |
| 讲师版 PPT 是否包含时间建议和控场提示 | pass | 每页包含时间建议、是否可跳过、纠错点和对应 script 段落。 |
| Teacher Script 是否和 PPT 页码对应 | pass | `lesson_01_teacher_script_v2.md` 开头含对应表，每段写明 T-Slide / S-Slide。 |
| 是否生成 slide-script mapping | pass | `lesson_01_slide_script_mapping.md` 覆盖 8 个时间段。 |
| PPT 作业说明是否和 homework 一致 | pass | S-Slide 29 / T-Slide 24 与 `lesson_01_homework_v2.md` 保持同一作业结构。 |
| 是否新增一页式速查表 | pass | `lesson_01_student_cheatsheet.md` 已生成。 |
| 是否新增必背10句 | pass | `lesson_01_must_memorize_10_sentences.md` 已生成，覆盖 10 个功能。 |
| 是否新增会议前速查表 | pass | `lesson_01_before_meeting_quick_reference.md` 已生成，并覆盖 FI/CO、SD、MM、PP、Basis、ABAP/BTP。 |
| 是否完成日语自然度复核 | pass | `lesson_01_japanese_naturalness_review.md` 已完成，明确 `おっしゃる通りです` 使用边界。 |
| 是否仍控制在60分钟 | pass | mapping 与 teacher script 均按 00:00-60:00 设计。 |
| 是否适合中国 SAP 顾问 | pass | 场景、句型、作业覆盖客户坚持现行流程、SAP 标准、内部统制、跨模块影响。 |
| 是否可作为 Lesson 02-24 模板 | review | 文件结构可复制，但建议用户先确认商业风格、文件粒度和日语语气。 |

## 仍需人工确认事项

1. 是否希望学生版 PPT 最终变成“少字大字号”的真实授课 PPT，还是保持当前“可复习型 PPT outline”。
2. Lesson 01 是否需要更强 FI/CO 倾斜；当前 v2 保持多模块适配。
3. 日语自然度虽已二次复核，但商业正式发售前建议请日本项目经验者或日语母语者抽样审阅。
4. 是否需要为每个日语长句增加假名或罗马音；当前只在关键词和语气处提示。
5. 是否需要把 PPTX 制作纳入下一步专门任务；本轮优先完成 Markdown 商业样板。

## 后续复制到 Lesson 02-24 的规则

1. 每课必须有学生交付物清单，不能只有讲师资料。
2. 每课 PPT 必须拆成讲师版和学生版。
3. 每课 teacher script 必须绑定 PPT 页码和时间段。
4. 每课必须有一页式速查表、必背句和会议/场景前速查。
5. 每课 homework 必须和 PPT 末页一致。
6. 每课必须做日语自然度复核，标出“可用但有风险”的表达。
7. 每课必须保留 SAP 项目场景，不写成普通商务日语。

## 不建议继续批量生成前必须确认的点

- 文件数量是否符合用户商业交付预期。
- 学生版 PPT 的文字密度是否合适。
- 讲师逐字稿是否符合用户个人授课口吻。
- `ご意向は理解いたしました` 等替代表达是否符合用户想教给学生的语气。
- 是否要每课额外输出 PPTX / PDF / DOCX 成品。

## PPTX 生成状态

本轮未生成 PPTX。原因：当前提示词的第一目标是 `output/lesson_01_v2/` 下的全部 Markdown 文件；本机可见 `pandoc`，但没有稳定的商业 PPTX 视觉 QA 链路。为避免生成未经验证的低质量 PPTX，本轮交付详细 outline，后续可单独进入 PPTX 制作和视觉检查流程。
