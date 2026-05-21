# 需确认 · sap-jp.training 站点审计 · 2026-05-21

- updated_by: codex
- updated_at: 2026-05-22T08:04:26+09:00
- status: waiting_for_user

## 阻塞范围

sap-jp.training 本地站点审计中的 authenticated end-to-end validation。

## 请提供 / 确认

1. 测试学生邮箱。
2. 测试讲师邮箱。
3. 是否允许 Codex 在本地创建测试用户。
4. 是否允许 Codex 读取本地 magic-link token / verification token 来建立测试会话。

## 为什么需要

请求的 authenticated 检查需要真实或明确授权的测试 session：

- 学生录音：fake media or microphone -> start/pause/stop -> draft playback -> save -> history playback -> delete。
- 云端录音：sign -> PUT -> PATCH -> `/api/recordings` visible。
- 讲师：`/teacher/recordings` list -> detail -> playback -> score/comment/corrected Japanese -> save。
- 学生 review：`/review` shows teacher feedback, corrected Japanese, and playback。
- API RBAC：学生不能读取其他人的录音；讲师只能读取自己班级学生；未授权请求返回 401/403。

## 停手规则

在用户确认测试输入和权限前，不运行 authenticated E2E、真实邮箱登录、真实麦克风权限流程、magic-link token 读取、本地测试用户创建、R2 delete 或 DB reset。
