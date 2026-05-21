# 交接 · 管理监控台 · 2026-05-21

- updated_by: codex
- updated_at: 2026-05-22T08:04:26+09:00
- scope: sap-jp.training 的 admin 运维监控台

## 已完成

- 新增 admin-only 路由 `/admin`。
- 新增 server-only read model：`web/lib/admin/ops-dashboard.ts`。
- 新增 Neon-backed 只读统计：users、roles、classes、enrollments、course assets、learning events、recordings、feedback、review terms、estimated recording storage。
- 新增快捷链接：GitHub、GitHub Actions、Vercel、Cloudflare、Neon、Sentry、Resend、Upstash、Google Search Console、Safe Browsing appeal。
- 新增可选只读外部状态读取：
  - GitHub Actions：通过 `GITHUB_REPOSITORY` 和可选 `GITHUB_TOKEN`。
  - Vercel Deployments：通过 `VERCEL_API_TOKEN`、`VERCEL_PROJECT_ID` 和可选 `VERCEL_TEAM_ID`。
- 新增环境变量存在性检查，只显示 configured/missing，不显示 secret 值。
- 将 `/admin` 加入 middleware matcher，并保留 server page role guard 作为最终权限边界。
- 在桌面和移动导航增加 `管理监控`。
- 更新 `web/docs/ADMIN_OPS.md`。

## 安全边界

- `/admin` 需要 Auth session role `admin`。
- 未登录用户跳转 `/login?callbackUrl=/admin`。
- 非 admin 用户跳转 `/`。
- 页面只读。它不会 deploy、mutate DB、delete R2 objects、修改 SaaS settings 或启动付款。
- API token 必须只留在本地 `.env.local` 或 Vercel env，永远不要写进 git。

## 验证

- `npm run typecheck`：PASS。
- `npm run lint`：PASS exit code；untracked `web/scripts/site-ledger.mjs` 中存在无关 warning。
- `npm run build`：停止旧 dev servers 后 PASS；`/admin` 作为 dynamic route 出现。
- `CIRCLE_NODE_TOTAL=1 npm run build`：PASS，用于确认短暂 Next static-generation race 不是本改动造成。
- Local smoke：logged out `GET /admin` 返回 `307` 到 `/login?callbackUrl=%2Fadmin`。

## 未完成

- 未部署到 Vercel。
- 未创建 GitHub/Vercel API tokens。
- 未直接连接 Cloudflare、Neon、Sentry、Resend、Upstash 或 Google APIs；本轮只做安全快捷链接和 env presence checks。
- Authenticated admin visual smoke 仍阻塞，直到 Ryan 提供或确认 admin 测试登录路径。
