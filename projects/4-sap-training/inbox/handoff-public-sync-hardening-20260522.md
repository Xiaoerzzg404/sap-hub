# 交接 · sap-jp.training 公网同步与 hardening 复核 · 2026-05-22

- updated_by: codex
- updated_at: 2026-05-22T10:38:40+09:00
- status: platform_config_pending
- branch: `codex/sap-jp-content-audit-20260521`
- commit: `cbb7ed25024de899553d38c63ddb8635a4f8d6c5`
- PR: `https://github.com/Xiaoerzzg404/sap-hub/pull/1`
- Preview: `https://sap-jp-training-git-codex-sap-jp-co-0cd67d-xiaoer-ql-s-projects.vercel.app`
- Production: `https://sap-jp.training`，本轮未合并 main，未执行生产部署

## 本轮已做

1. 按 Project 4 规则重新读取 `AGENTS.md`、`AGENT_GUARDRAILS.md`、`_instructions.md`、state、最新 handoff、两个 need-input。
2. 运行 `git status`：工作区起始时干净，当前分支领先远端 1 个 commit。
3. 跑通本地非交互验证：`npm run typecheck`、`npm run lint`、`npm run build`。
4. 推送本地领先 commit 到 PR 分支，PR #1 仍为 draft，Vercel Preview 对新 commit 返回 success。
5. 定向创建/更新 3 个 smoke test 账号，使用强随机密码；密码未打印、未写入 Git 或 Markdown。
6. 检查历史无密码账号：存在 5 个 `password_hash is null` 账号记录；未读取 magic-link token、session cookie 或任何可登录凭据。
7. 更新两份 need-input：
   - `projects/4-sap-training/inbox/need-input-audio-r2-verification-20260522.md`
   - `projects/4-sap-training/inbox/need-input-auth-hardening-20260522.md`

## 平台与环境状态

| 项目 | 状态 |
|---|---|
| R2 上传 | 已有证据：1543/1543 uploaded，failed 0，前缀 `course-audio/20260521/` |
| R2/CDN 策略 | Ryan 已确认，仅允许公开课程 TTS 音频前缀 |
| Git mp3 | Ryan 已否决 force-add；当前 Git 未跟踪 mp3 |
| Vercel artifact deploy | Ryan 已否决；本轮未使用 |
| `NEXT_PUBLIC_COURSE_AUDIO_BASE_URL` | 未配置；本地没有该 env，无法在 Vercel 配置 |
| `REGISTRATION_INVITE_CODE` | 未配置；本地无 Vercel CLI/API/项目绑定权限 |
| `OWNER_BOOTSTRAP_TOKEN` | 未使用、未配置、未删除或轮换 |
| `ACCOUNT_CLAIM_TOKEN` | 本轮未配置；仅在 Ryan 确认历史无密码账号本人需要认领时短期开启 |
| smoke 账号 | student / teacher / admin 三个专用邮箱已 upsert，密码未披露 |

## 验证结果

| 验证项 | 结果 |
|---|---|
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS，存在 Sentry/Prisma webpack warning 与 pg SSL 模式提示 |
| GitHub PR | PR #1 open、draft、mergeable |
| Vercel Preview | 新 commit `cbb7ed25024de899553d38c63ddb8635a4f8d6c5` 状态 success |
| Preview `/login` | 200 |
| 未登录 `/me` | 307 到 `/login?callbackUrl=%2Fme` |
| Preview 无邀请码注册 | 503 `registration_closed`，注册 fail-closed |
| student authenticated | `/me` 200，`/review` 200，`/courses/lessons/lesson_01` 200 |
| teacher authenticated | `/teacher` 200 |
| admin authenticated | `/admin` 200 |
| Preview 音频 fallback | authenticated `/audio/phrase/lesson_01-phrase-001.mp3` 为 404，未通过 |

## 音频抽查

本地 authenticated 抽查通过，均为 range load：

| 类型 | 路径 | 结果 |
|---|---|---|
| phrase | `/audio/phrase/lesson_01-phrase-001.mp3` | HTTP 206，`audio/mpeg`，可加载字节 |
| shadowing | `/audio/shadowing/lesson_01-shadow-01.mp3` | HTTP 206，`audio/mpeg`，可加载字节 |
| term | `/audio/term/lesson_01-term-001.mp3` | HTTP 206，`audio/mpeg`，可加载字节 |

公网 CDN 抽查未完成。原因：缺少公开 CDN base URL，且 Vercel Preview 未配置 `NEXT_PUBLIC_COURSE_AUDIO_BASE_URL`，因此浏览器仍会落到 `/audio` fallback；Preview 上 mp3 不进 Git，所以 fallback 404。

## 安全边界

- 未打印 token、密码、session、cookie、数据库连接串、API key。
- 未读取 magic-link token 或 session cookie。
- 未发送真实邮件。
- 未接管真实账号。
- 未执行 DB reset / truncate / 覆盖真实生产数据。
- 未公开 student recordings、teacher recordings、feedback、用户上传录音或个人数据。
- 未合并 PR，未生产部署。

## Ryan 需要人工登录检查

1. Cloudflare R2 / CDN：只公开 `course-audio/20260521/` 课程 TTS 前缀，并确认个人数据前缀未公开。
2. Vercel Preview / Production：配置 `NEXT_PUBLIC_COURSE_AUDIO_BASE_URL`，重新触发构建。
3. Vercel Preview / Production：配置 `REGISTRATION_INVITE_CODE`，值由 Ryan 自行保存和发放。
4. 如需 owner 初始化：短期配置 `OWNER_BOOTSTRAP_TOKEN`，完成后删除或轮换。
5. 如需历史无密码账号认领：短期配置 `ACCOUNT_CLAIM_TOKEN`，只发给对应本人，完成后删除或轮换。
6. 继续检查 Sentry、Upstash、Resend、Google Search Console / Safe Browsing。

## 未解决风险与下一步

- 生产发布仍阻塞在两个必需配置：公开课程音频 CDN base URL 与生产邀请码。
- 当前注册是安全的 fail-closed 状态，但 beta 学员无法自助注册，需 Vercel env 配置后复测。
- 当前 Preview 登录/RBAC smoke 通过，但课程音频公网播放未通过，不能把 PR 标为 ready 或合并生产。
- 配置完成后下一步：重新触发 Preview，抽查 phrase / shadowing / term 三个 CDN URL，复测注册邀请码和 authenticated smoke，再决定是否 mark PR ready、merge、生产部署。
