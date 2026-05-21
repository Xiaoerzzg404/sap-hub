# ADMIN_OPS · SAP 日语口语训练平台

- updated_by: codex
- updated_at: 2026-05-22T08:04:26+09:00
- scope: Phase 7 上线准备、admin 运维监控台、账号密码登录

## 登录与角色

当前登录方式：

- 用户使用邮箱、用户名和密码注册。
- 用户可以用邮箱或用户名登录。
- 密码以 `scrypt` hash 存在 `users.password_hash`。
- 未登录用户只能看到 `/login`；训练页面、`/audio/*` 和业务 API 都需要 session。
- 角色是多值模型，存储在 `user_roles`。
- `users.role` 保留为 legacy 主角色兼容字段。

角色模型：

| 角色      | 可访问范围                                                    |
| --------- | ------------------------------------------------------------- |
| `student` | 学员学习页、口语工具、作业、录音、复盘。                      |
| `teacher` | 讲师课程工具、学生录音复核、反馈、待复核术语。                |
| `admin`   | 管理监控和运营总览；admin 为支持排障可访问讲师/学员相关页面。 |

Owner 初始化：

- migration `0003_auth_credentials_multi_role.sql` 会在 `zzg404@gmail.com` 已存在时授予 `student`、`teacher`、`admin` 三个角色。
- 如果 `zzg404@gmail.com` 在 migration 后注册，`/api/auth/register` 会自动授予同样三种角色。

## 管理监控台

路由：`/admin`

访问边界：

- 未登录用户：跳转 `/login?callbackUrl=/admin`。
- 非 admin 用户：跳转首页。
- admin 用户：可见只读管理监控页。

页面内容：

- Neon Postgres 只读统计：用户、学生、讲师、班级、课程、素材、录音、讲师反馈、待复核术语等。
- 外部平台快捷入口：GitHub、Vercel、Cloudflare、Neon、Sentry、Resend、Upstash、Google Search Console、Safe Browsing 申诉。
- 环境变量检查：只显示是否配置，不显示值。
- 本地改订发布流：本地修改 -> typecheck/lint/build/browser check -> commit -> deploy -> 线上复查。

可选外部监控数据：

| 平台   | 可选 env                                                           | 用途                                   |
| ------ | ------------------------------------------------------------------ | -------------------------------------- |
| GitHub | `GITHUB_REPOSITORY`, `GITHUB_TOKEN`                                | 读取最新 GitHub Actions workflow run。 |
| Vercel | `VERCEL_API_TOKEN`, `VERCEL_PROJECT_ID`, optional `VERCEL_TEAM_ID` | 读取最新 Vercel deployment 状态。      |

这些 token 不得提交到 git。只放在本地 `.env.local` 或 Vercel Project Settings -> Environment Variables。

暂未直接拉取的外部数据：

- Cloudflare R2 用量、lifecycle 规则：先通过 Cloudflare Dashboard 查看。
- Neon backup/storage 细节：先通过 Neon Console 查看。
- Sentry issue 列表：先通过 Sentry Console 查看。
- Google Safe Browsing 申诉状态：先人工跟进。

## R2 Lifecycle

Cloudflare R2 bucket: `sap-jp-recordings`

Ryan 在 Cloudflare Dashboard 手动配置：

1. 打开 Cloudflare Dashboard。
2. 进入 R2 -> `sap-jp-recordings` -> Settings -> Object Lifecycle Rules。
3. 新增规则 `archive-after-90d`。
4. Prefix 填 `audio/`。
5. Action 选择 90 天后 transition to Infrequent Access。
6. 再新增规则 `delete-after-365d`。
7. Prefix 填 `audio/`。
8. Action 选择 365 天后 delete。

注意：应用内“删除录音”先做 30 天软删除。R2 lifecycle 是兜底运营规则，不替代应用的硬删除任务。

## Neon Backup

Neon Dashboard:

1. 打开 Neon Project。
2. 进入 Backups & Restore。
3. 确认 Daily Snapshot 已开启。
4. Free tier 默认保留周期较短；正式招生后每周人工导出一次 SQL 备份。

每周手动备份命令：

```bash
pg_dump "$DATABASE_URL" > backup-$(date +%Y%m%d).sql
```

备份文件不得提交到 git。建议本地加密保存，或上传到私有 R2/Drive 目录。

## 容量监控

每月第一周人工检查一次：

| SaaS          | 检查位置                             |               Phase 7 阈值 |
| ------------- | ------------------------------------ | -------------------------: |
| Neon          | Dashboard -> Storage                 |                   < 0.5 GB |
| Cloudflare R2 | R2 -> `sap-jp-recordings` -> Metrics |                    < 10 GB |
| Vercel        | Project -> Usage                     | < 100 GB bandwidth / month |
| Resend        | Dashboard -> Emails                  |       < 100 emails / month |

任一指标超过 80% 阈值时，先记录截图和用量，再升级对应 SaaS plan。

## 录音硬删除

Phase 7 已实现：

- 学生 DELETE `/api/recordings/:id`：写 `deleted_at`，状态改为 `deleted`。
- GET `/api/recordings`：不返回软删除录音。
- GET `/api/teacher/recordings`：不返回软删除录音。
- GET `/api/cron/cleanup-recordings`：删除 30 天前已软删除的 DB row，并删除对应 R2 object。

当前本地 `.env.local` 已配置 `CRON_SECRET`。上线前必须确认 Vercel Project Settings 也有同名 env：

```bash
CRON_SECRET=<openssl rand -base64 32 的输出>
```

Vercel Cron schedule：

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-recordings",
      "schedule": "0 3 * * *"
    }
  ]
}
```

UTC 03:00 对应东京 12:00。Cron 请求必须带 `Authorization: Bearer $CRON_SECRET`；没有 secret 时端点返回 503。

## 事故记录注意事项

不要在 issue、日志、截图、handoff 里写出完整 `DATABASE_URL`、R2 key secret、Resend key、Upstash token、Sentry auth token 或 `CRON_SECRET`。

## 本地改订与部署

页面、label、课程内容、TTS 音频、反馈功能和老师端功能都先在本地改订，验证后再部署到 Vercel。

执行顺序以 `docs/SITE_ARCHITECTURE.md` 为准：

1. 本地分支修改。
2. 必要时转换课程数据或生成 TTS。
3. 本地 typecheck/lint/build。
4. 本地浏览器检查改动页面。
5. commit。
6. 部署。
7. 上线后检查 Sentry、登录、学生页、老师反馈流。

## 提升用户角色

讲师和 admin 权限只能通过 SQL 手动提升。不要实现前台自助提升接口。

查看用户：

```sql
select u.id, u.email, u.username, array_agg(ur.role order by ur.role) as roles, u.created_at
from users
left join user_roles ur on ur.user_id = u.id
group by u.id
order by created_at desc
limit 20;
```

授予讲师：

```sql
insert into user_roles (user_id, role, assigned_by)
select id, 'teacher', 'admin'
from users
where email = 'teacher@example.com'
on conflict (user_id, role) do nothing;
```

授予 admin：

```sql
insert into user_roles (user_id, role, assigned_by)
select id, 'admin', 'admin'
from users
where email = 'ryan@example.com'
on conflict (user_id, role) do nothing;
```

移除讲师权限：

```sql
delete from user_roles
where role = 'teacher'
  and user_id = (select id from users where email = 'teacher@example.com');
```

同步 legacy 主角色：

```sql
update users
set role = 'student', updated_at = now()
where email = 'teacher@example.com';
```

## 班级 enrollment 检查

讲师只能看自己班级 active enrollment 的学生。

排查讲师看不到学生：

```sql
select c.id as class_id, c.name, c.teacher_id, e.student_id, e.status
from classes c
join enrollments e on e.class_id = c.id
where c.teacher_id = '<teacher-user-id>'
order by c.created_at desc;
```

如果 enrollment 不是 `active`，讲师列表不会显示该学生。

## Sentry

Phase 7 已安装 `@sentry/nextjs`，且本地 `.env.local` 已存在 `NEXT_PUBLIC_SENTRY_DSN`。上线前必须确认 Vercel env 同步。

Runtime 初始化由 `sentry.server.config.ts`、`sentry.edge.config.ts`、`sentry.client.config.ts` 读取 `NEXT_PUBLIC_SENTRY_DSN` 完成。`withSentryConfig` 构建插件默认关闭，只在明确设置 `SENTRY_BUILD_PLUGIN_ENABLED=true` 时启用；否则本地/生产 build 不应因为 DSN 存在而改变 Next chunk 输出。

启用步骤：

1. 在 Sentry 新建 Next.js project。
2. 复制 DSN。
3. 在 Vercel Project Settings -> Environment Variables 增加 `NEXT_PUBLIC_SENTRY_DSN`。
4. 重新部署。
5. 打开 Sentry Issues，确认有 release 或 runtime event。

不要把 Sentry auth token 写入 git。当前配置没有上传 source map 的强需求。

## Rate Limit

Phase 7 已安装 Upstash soft dependency，且本地 `.env.local` 已存在 Upstash REST env。上线前必须确认 Vercel env 同步。

Vercel env 检查：

1. 在 Upstash 创建 Redis REST database。
2. 在 Vercel env 增加 `UPSTASH_REDIS_REST_URL`。
3. 在 Vercel env 增加 `UPSTASH_REDIS_REST_TOKEN`。
4. 重新部署。

默认配额：

| Flow                  | Identifier      |       Limit |
| --------------------- | --------------- | ----------: |
| Login                 | IP              |  5 / minute |
| Recording upload sign | user id         | 10 / minute |
| Teacher feedback      | teacher user id | 30 / minute |
| General helper        | user id         |  5 / second |
