# Phase 7 RBAC 审计 · 2026-05-21

- updated_by: codex
- updated_at: 2026-05-22T08:04:26+09:00
- scope: Project 4 web API 路由与讲师页面

## 结论

本轮 Phase 7 RBAC 审计没有发现代码层权限缺口。

## API 路由

| Route | Session | Role | 学员隔离 / 访问范围 |
|---|---:|---:|---|
| `app/api/auth/[...nextauth]/route.ts` | Public Auth.js handler | n/a | Auth.js 管理的 email callback/sign-in flow |
| `app/api/lessons/[lessonId]/assets/[kind]/route.ts` | 未登录 401 | n/a | 只读内容，不访问学员 row |
| `app/api/library/[kind]/route.ts` | 未登录 401 | n/a | 只读内容，不访问学员 row |
| `app/api/progress/events/route.ts` | 未登录 401 | n/a | GET/POST 都限制在 `progressEvents.studentId = session.user.id` |
| `app/api/recordings/route.ts` | 未登录 401 | n/a | GET/POST 都限制在 `recordings.studentId = session.user.id` |
| `app/api/recordings/sign/route.ts` | 未登录 401 | n/a | Insert 使用 `studentId = session.user.id`；R2 key 使用 session user prefix |
| `app/api/recordings/[id]/route.ts` | 未登录 401 | n/a | PATCH 要求 `recordings.id` 且 `recordings.studentId = session.user.id` |
| `app/api/teacher/recordings/route.ts` | 未登录 401 | 非 teacher/admin 返回 403 | 讲师查询限制在 active enrollment；admin 可查看全部 |
| `app/api/teacher/recordings/[id]/feedback/route.ts` | 未登录 401 | 非 teacher/admin 返回 403 | 讲师反馈必须拥有该录音学生的 active enrollment 访问权；admin 可访问全部 |

## 讲师页面

所有讲师页面渲染前都会调用 `auth()`，并把非 teacher/admin 用户导离讲师区：

- `app/teacher/page.tsx`
- `app/teacher/recordings/page.tsx`
- `app/teacher/recordings/[id]/page.tsx`
- `app/teacher/review-terms/page.tsx`

## 与后续 Phase 7 子任务的耦合

`deleted_at` column 存在后，子任务 6 会在录音列表 API 中过滤软删除录音。
