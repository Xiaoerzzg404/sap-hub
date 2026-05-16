# Lesson 01 v3 PPTX 生成说明

updated_by: codex
updated_at: 2026-05-16T23:35:00+09:00

## 生成状态

本轮未生成 PPTX。

## 原因

当前任务的核心是生成完整 Lesson 01 v3 Markdown 商业样板课包。虽然本机存在 `pandoc`，但没有执行商业 PPTX 所需的视觉 QA 流程，包括：

- 渲染每页预览；
- 检查学生版是否无讲师提示；
- 检查字体、断行、表格可读性；
- 检查 34 页学生版和 24 页讲师版是否能稳定导出；
- 检查中文、日文混排。

为避免交付未经验证的 PPTX，本轮只交付可转 PPTX 的详细 outline。

## 后续生成 PPTX 的输入

- 学生版：`lesson_01_student_ppt_outline.md`
- 讲师版：`lesson_01_teacher_ppt_outline.md`
- 生成提示：`lesson_01_ppt_generation_prompts.md`

## 验收要求

PPTX 生成后必须人工或自动检查：

1. 学生版无讲师内部提示；
2. 讲师版有时间建议和控场提示；
3. 作业页与 homework v3 一致；
4. 硬指标 5 句清晰可见；
5. 对话 5 版本可读；
6. 表格不溢出。
