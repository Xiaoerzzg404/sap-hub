# SITE_ARCHITECTURE · sap-jp.training

- updated_by: codex
- updated_at: 2026-05-22T08:46:38+09:00
- scope: 学员产品架构、登录边界、内容改订流程和部署纪律

## 产品形态

Phase 1 是 24 课 SAP 项目日语口语训练课。网站应该像一个训练工作台，而不是静态课程资料库：

- `/me`：学员首页，集中显示当前课、24 课进度、笔记、录音和老师反馈。
- `/dashboard`：每日任务和推荐下一课。
- `/courses` 与 `/courses/lessons/[lessonId]`：课程运行页，包含来源素材、日语教练、五步训练、drill、role play 和作业。
- `/speaking/*`：专项口语工具，包括 shadowing、重复播放、录音、自训、30 秒短练和 60 秒顾问输出。
- `/assignments`：作业提交入口。
- `/review`：收藏、弱点、讲师反馈和录音历史。
- `/teacher/*`：讲师复核、反馈、术语复核和课堂教练。
- `/admin`：admin-only 运维监控台。
- `/login`：唯一匿名页面；所有训练内容都需要登录。

## 数据边界

课程内容和学员数据不能混在一起。

| 领域             | 真相源                                     | 运行时形态                                         |
| ---------------- | ------------------------------------------ | -------------------------------------------------- |
| 课程内容         | Project 4 课程目录下的本地 Markdown 资产   | 生成后的 JSON 和已 seed 的 Postgres content tables |
| 站点导航与 label | Next.js 源码                               | 随 Vercel build 部署                               |
| 学员进度         | `progress_events` 加 localStorage fallback | `/api/progress/events` 与 client cache             |
| 学员录音         | R2 object storage 加 `recordings` metadata | `/api/recordings`、软删除、signed playback         |
| 讲师反馈         | `teacher_feedback`                         | 学员 `/review` 与 `/me`、讲师复核页                |
| 学员笔记         | beta 阶段使用浏览器 localStorage           | 若需要跨设备笔记，再升级 DB table                  |
| 登录凭据         | `users.username`、`users.password_hash`    | 邮箱/用户名 + 密码登录；生产注册受邀请码保护       |
| 角色与权限       | `user_roles` 加 legacy `users.role`        | 多角色 session claims `roles[]`                    |

稳定课次 id（例如 `lesson_01`）必须在内容重写后继续保持。改写会改变 lesson revision，不改变学生进度 row 的身份。

## 改订流程

不要直接改生产。安全路径是：

1. 在 `sap-hub` 创建或使用本地分支。
2. 从 `projects/4-sap-training/web` 运行 `npm run ledger:snapshot -- --label before-<task>`。
3. 在本地修改课程 Markdown、页面 label 或功能代码。
4. 如果内容变化，运行 `npm run convert:content`。
5. 如果 DB seed 数据变化，先在指定 local/staging DB 跑 seed/migration。
6. 从 `projects/4-sap-training/web` 运行 `npm run ledger:check`、`npm run typecheck`、`npm run lint`、`npm run build`。
7. 本地用浏览器 smoke 改动页面。
8. 运行 `npm run ledger:snapshot -- --label after-<task>`、`npm run ledger:diff -- --write`、`npm run ledger:rebuild-plan`。
9. 按 `AGENTS.md` 要求的 agent message 格式 commit。
10. 只有本地验证通过后才部署到 Vercel。
11. 部署后检查公网页面、登录、Sentry，以及受影响的学员/讲师流程。

这个流程适用于页面 label、导航、课程文本、音频路径、TTS 资产、录音流程、隐私文本和讲师反馈 UI。

## 内容版本

当前站点 `_meta.schemaVersion = 1.4.0`。后续较大的 beta 改动前，应加入明确 release metadata：

- `contentRelease`：人类可读标签，例如 `2026-06-beta-01`。
- `lessonRevisions`：每课 revision id、source path、generated timestamp 和 reviewer status。
- `migrationNotes`：已经开始学习的学生会受到什么影响。

推荐规则：不要自动清空或废弃已有进度。如果某课大改，提示学生有新 revision，并由老师判断班级是否需要重做。

## 站点 Ledger

用 `docs/SITE_CHANGE_LEDGER.md` 和 `ops/site-ledger/` 作为 sap-jp.training 本地变更台账。Ledger 用 JSON/Markdown 记录路由地图、内容 hash、数据数量、package scripts、Git 脏状态和重建说明，便于用户和 AI 工具看清改了什么，以及如何恢复。

## 近期架构决定

- 保持 `/me` 作为学员主要回流页面。
- 保持 `/review` 用于更深入的复盘和反馈历史。
- beta 阶段笔记先保留本地；如果学员需要跨设备，再做云同步。
- 生产环境不开放无门槛注册：`REGISTRATION_INVITE_CODE` 控制学生注册，历史无密码账号认领需要 `ACCOUNT_CLAIM_TOKEN`，owner 初始化需要 `OWNER_BOOTSTRAP_TOKEN`。
- TTS 音频视为生成资产：本地用 `AZURE_SPEECH_KEY` 生成，检查路径后再部署。
- Sentry、Safe Browsing 和 beta 学员反馈都作为运营信号，先反馈到本地修复，再做下一次部署。
