# 交接 · SAP 日语训练站 A/B 接入 Insight Desk · 2026-06-10

- updated_by: codex
- updated_at: 2026-06-10T10:25:00+09:00
- status: local_integrated

## 范围

本轮按 Ryan 指令，把 SAP 日语训练平台两个版本接入本机 SAP Insight Desk：

- A：本地升级版，路径 `/Users/openclawxiaoer/sap-hub/projects/4-sap-training/web`，本轮固定本地入口 `http://127.0.0.1:3214/`。
- B：公网已发布版，实测有效域名为 `https://sap-jp.training`；用户消息里的 `sap-jp.trainning` 当前无法解析。
- B 的本机静态备份已生成在 `/Users/openclawxiaoer/.codex/worktrees/aa5a/OpenClaw/sap-news-pipeline/insight-desk/sap-jp-training-public-backup/`，本地入口 `http://127.0.0.1:7788/sap-jp-training-public-backup/index.html`。

本轮没有执行 Vercel 生产部署、PR merge、R2 写入、DB migration、真实账号操作、外部发布或付款。

## 修改文件

Insight Desk：

- `/Users/openclawxiaoer/.codex/worktrees/aa5a/OpenClaw/sap-news-pipeline/insight-desk/index.html`
- `/Users/openclawxiaoer/.codex/worktrees/aa5a/OpenClaw/sap-news-pipeline/insight-desk/practical.html`
- `/Users/openclawxiaoer/.codex/worktrees/aa5a/OpenClaw/sap-news-pipeline/insight-desk/gossip.html`
- `/Users/openclawxiaoer/.codex/worktrees/aa5a/OpenClaw/sap-news-pipeline/insight-desk/library.html`
- `/Users/openclawxiaoer/.codex/worktrees/aa5a/OpenClaw/sap-news-pipeline/insight-desk/published.html`
- `/Users/openclawxiaoer/.codex/worktrees/aa5a/OpenClaw/sap-news-pipeline/insight-desk/published.css`
- `/Users/openclawxiaoer/.codex/worktrees/aa5a/OpenClaw/sap-news-pipeline/insight-desk/styles.css`
- `/Users/openclawxiaoer/.codex/worktrees/aa5a/OpenClaw/sap-news-pipeline/insight-desk/console/console.html`
- `/Users/openclawxiaoer/.codex/worktrees/aa5a/OpenClaw/sap-news-pipeline/insight-desk/sap-jp-training-public-backup/`

Project 4：

- `/Users/openclawxiaoer/sap-hub/projects/4-sap-training/state/sap_jp_training_course.json`
- 本交接文件

## 已完成

- 在 Insight Desk 主入口、SAP 干货、SAP 档案、素材库、已发布、控制台的主导航中加入：
  - `日语A本地` → `http://127.0.0.1:3214/`
  - `日语B备份` → `http://127.0.0.1:7788/sap-jp-training-public-backup/index.html`
- 修正 `index.html` 顶栏中既有的“公众号已发布”和“控制台”链接嵌套错误。
- 给 Insight Desk 顶栏导航增加换行支持，避免 A/B 标签挤压窄屏。
- 抓取 `https://sap-jp.training` 的本机静态备份：
  - 路由尝试：18
  - 路由成功：17
  - `_next` 静态资源发现：10
  - `_next` 静态资源成功：10
  - `/admin` 当前公网返回 404，已记录在 `manifest.json`，不伪装成功。
- 修正 B 备份 HTML 内联 RSC 残留的 `/_next/` 根路径引用，确保资源从备份目录下加载。
- 更新 Project 4 state 的 `latest_insight_desk_integration`。

## 验证

- `curl -I -L --max-time 20 https://sap-jp.training`：HTTP 200。
- `curl -I -L --max-time 20 https://sap-jp.trainning`：DNS 解析失败。
- `curl -I --max-time 5 http://127.0.0.1:7788/index.html`：HTTP 200。
- `curl -I --max-time 5 http://127.0.0.1:7788/sap-jp-training-public-backup/index.html`：HTTP 200。
- `curl -I --max-time 20 http://127.0.0.1:3214/`：307 到 `/login?callbackUrl=%2F`，符合当前登录墙逻辑。
- `curl -I --max-time 20 http://localhost:3214/login`：HTTP 200。
- `lsof -nP -iTCP:3214 -sTCP:LISTEN`：`node` 正在监听 `127.0.0.1:3214`。
- A 服务运行方式：`screen` detached 会话 `sap-jp-training-3214`；日志 `/Users/openclawxiaoer/sap-hub/projects/4-sap-training/web/logs/sap-jp-training-dev-3214.log`。
- `jq empty projects/4-sap-training/state/sap_jp_training_course.json`：PASS。
- Browser smoke：
  - `http://127.0.0.1:7788/index.html`：A/B 标签可见，主导航链接正确，无横向溢出。
  - `http://127.0.0.1:7788/sap-jp-training-public-backup/index.html`：标题与训练平台内容可见，CSS/JS 从备份目录加载，无根目录 `_next` 残留，无横向溢出。
  - `http://127.0.0.1:3214/`：按 A 当前登录墙跳转到 `http://localhost:3214/login?callbackUrl=%2F`，登录页可见。

待运行：

- 本轮未跑 A 的 `npm run typecheck/lint/build`，因为没有改 A 的业务代码、录音逻辑或权限逻辑；只启动 dev server 并验证入口。
- A dev server 日志有既有 Sentry/Prisma OpenTelemetry `Critical dependency` warning；未阻断 ready 或登录页访问。

## 停手点

- 未把 A 的开发中版本发布到公网。
- 未把 B 静态备份声明为完整生产替代品；它是本机查看/备份用静态快照，动态登录、API、录音上传、数据库和外部认证不会在快照内执行。
- 未安装 launchd 常驻服务；如需开机自启，需要 Ryan 另行确认。
