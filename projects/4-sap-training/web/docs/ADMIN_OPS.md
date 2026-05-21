# ADMIN_OPS · SAP 日语口语训练平台

- updated_by: codex
- updated_at: 2026-05-21T12:00:00+09:00
- scope: Phase 7 launch-readiness operations

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

## Capacity Monitoring

每月第一周人工检查一次：

| SaaS | 检查位置 | Phase 7 阈值 |
|---|---|---:|
| Neon | Dashboard -> Storage | < 0.5 GB |
| Cloudflare R2 | R2 -> `sap-jp-recordings` -> Metrics | < 10 GB |
| Vercel | Project -> Usage | < 100 GB bandwidth / month |
| Resend | Dashboard -> Emails | < 100 emails / month |

任一指标超过 80% 阈值时，先记录截图和用量，再升级对应 SaaS plan。

## Recording Hard Delete

Phase 7 已实现：

- 学生 DELETE `/api/recordings/:id`：写 `deleted_at`，状态改为 `deleted`。
- GET `/api/recordings`：不返回软删除录音。
- GET `/api/teacher/recordings`：不返回软删除录音。
- GET `/api/cron/cleanup-recordings`：删除 30 天前已软删除的 DB row，并删除对应 R2 object。

当前 `.env.local` 未配置 `CRON_SECRET`。因此不要创建 Vercel Cron schedule，直到 Ryan 在 Vercel Project Settings 加入：

```bash
CRON_SECRET=<openssl rand -base64 32 的输出>
```

启用后再添加 Vercel Cron：

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

## Incident Notes

不要在 issue、日志、截图、handoff 里写出完整 `DATABASE_URL`、R2 key secret、Resend key、Upstash token、Sentry auth token 或 `CRON_SECRET`。
