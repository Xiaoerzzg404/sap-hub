# Need Input · sap-jp.training Site Audit · 2026-05-21

- updated_by: codex
- updated_at: 2026-05-21T22:43:52+09:00
- status: waiting_for_user

## Blocked Area

Authenticated end-to-end validation for sap-jp.training local site audit.

## Please Provide / Confirm

1. 测试学生邮箱。
2. 测试讲师邮箱。
3. 是否允许 Codex 在本地创建测试用户。
4. 是否允许 Codex 读取本地 magic-link token / verification token 来建立测试会话。

## Why This Is Needed

The requested authenticated checks require real or explicitly authorized test sessions:

- 学生录音：fake media or microphone → start/pause/stop → draft playback → save → history playback → delete.
- 云端录音：sign → PUT → PATCH → `/api/recordings` visible.
- 讲师：`/teacher/recordings` list → detail → playback → score/comment/corrected Japanese → save.
- 学生 review：`/review` shows teacher feedback, corrected Japanese, and playback.
- API RBAC：students cannot read others' recordings; teachers only read their own class students; unauthorized requests return 401/403.

## Stop Rule

No authenticated E2E, real mailbox login, real microphone permission flow, magic-link token read, local test-user creation, R2 delete, or DB reset will be run until the user confirms the requested test inputs and permissions.
