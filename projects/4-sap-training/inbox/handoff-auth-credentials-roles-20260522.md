# 交接 · 账号密码登录与多角色权限 · 2026-05-22

- updated_by: codex
- updated_at: 2026-05-22T08:04:26+09:00
- scope: `projects/4-sap-training/web`

## 已完成

- 将公开 magic-link 入口替换为邮箱/用户名 + 密码注册和登录。
- 新增 `/api/auth/register`；新用户获得 `student`，`zzg404@gmail.com` 自动获得 `student`、`teacher`、`admin`。
- 新增多角色 helpers 和 `user_roles` table，让一个用户可拥有多个角色。
- 新增 logged-out wall：匿名用户只能看到 `/login`；页面跳转登录，受保护 API 返回 `401`。
- 登录前隐藏 header/sidebar/training content；登录后按角色显示导航。
- 用角色检查保护 student、teacher、admin 页面和相关 API。
- 更新学生登录、讲师角色设置、admin 运维和架构文档。

## 验证

- `npm run typecheck`：PASS。
- `npm run lint`：PASS。
- `npm run build`：PASS。
- 在 `127.0.0.1:3210` 做 production smoke：
  - `/` -> `307 /login?callbackUrl=%2F`
  - `/courses` -> `307 /login?callbackUrl=%2Fcourses`
  - `/audio/phrase/lesson_01-phrase-001.mp3` -> `307 /login?...`
  - `/api/recordings` -> `401 {"error":"unauthorized"}`
  - invalid register payload -> `400 invalid_email`
  - `/login` 渲染新的 authentication workspace，且没有训练导航。

## 未运行

- 未将 `0003_auth_credentials_multi_role.sql` migration 应用到 Neon 或生产。
- 未部署到 Vercel。
- 未创建或打印任何密码/token。

## 下一步

把 `web/lib/db/migrations/0003_auth_credentials_multi_role.sql` 应用到目标数据库，部署，然后为 owner account 注册或设置密码，并对 `zzg404@gmail.com` 的角色路由做 smoke test。
