# Phase 6 执行版 · 自给自足

---

## Ryan 用法（极简两步）

### 第一步：commit 本文件 + 配置 R2 凭据

```bash
cd /Users/openclawxiaoer/sap-hub
git add logs/codex-phase6-prompt.md logs/codex-phase6-execute.md
git commit -m "docs: phase-6 execute prompt"
```

**外部凭据准备（Cloudflare R2）**：

1. 去 https://dash.cloudflare.com 注册或登录
2. 左侧菜单进 **R2 Object Storage**
3. 创建 bucket：name = `sap-jp-recordings`，location = `Automatic` 或 `Asia-Pacific`
4. 右上角 "Manage R2 API Tokens" → "Create API token"：
   - Name: `sap-jp-dev`
   - Permissions: `Object Read & Write`
   - Specify bucket: 选刚建的 `sap-jp-recordings`
   - TTL: `Forever`（开发期用）
5. 拿到 4 个变量：Access Key ID / Secret Access Key / Account ID / Bucket Name
6. 把以下 4 行**追加**到 `projects/4-sap-training/web/.env.local`（现有 5 行后面）：

```
R2_ACCOUNT_ID=<你的 Cloudflare Account ID，32 位 hex>
R2_ACCESS_KEY_ID=<R2 API Token Access Key ID>
R2_SECRET_ACCESS_KEY=<R2 API Token Secret Access Key>
R2_BUCKET_NAME=sap-jp-recordings
```

> `.env.local` 已 .gitignore 永不入库，安全。

### 第二步：开 Codex 新对话，发一句话

> 请执行 /Users/openclawxiaoer/sap-hub/logs/codex-phase6-execute.md 中的全部内容。遇到任何阻塞按文件内规则在 inbox 写 ask 停手。

**完。**

---

> **下面是给 Codex 看的，你不用动。**

---

# 给 Codex 的话

你正在执行 **SAP 日语口语训练平台 Phase 6「录音上传 R2 + 讲师反馈端到端」**。

Phase 5 把录音 metadata 落了 DB 但 blob 还在浏览器 IndexedDB；本 Phase 接 Cloudflare R2，
blob 真上云 + 讲师反馈写入闭环（评分 / 纠错 / 留言 / 邮件通知）。

| 章 | 内容 |
|---|---|
| 1 | 工作边界约束（所有 Phase 通用） |
| 2 | 起手自检 |
| 3 | Phase 6 凭据前置（R2 4 变量） |
| 4 | 任务包正文（10 子任务） |
| 5 | 完成后做什么 |

---

# 第 1 章 · 工作边界约束（所有 Phase 通用，最高优先级）

你在 Ryan 的 `sap-hub` 仓库工作。sap-hub 是 6 个 Project 统一仓库
（`1-ai-intel` / `2-sap-intel` / `3-sap-content` / `4-sap-training` / `5-sap-talent` / `6-biz-ops`），
你**只**能在 Project 4（SAP 日语培训）下、且仅限「基础线 24 课」当前产品线工作。

## 1.1 可写区域

1. `projects/4-sap-training/web/` — Next.js 网站源码
2. `projects/4-sap-training/web/.env.local` — 凭据文件，**永不入 git**
3. `projects/4-sap-training/web/lib/db/migrations/` — Drizzle 迁移
4. `projects/4-sap-training/inbox/` — handoff / need-input
5. `projects/4-sap-training/state/sap_jp_training_course.json` — 仅更新现有字段
6. `logs/` — handoff / 报告

## 1.2 只读区域

- `projects/4-sap-training/SAP日语培训/` — 只 read
- `projects/4-sap-training/sap_jp_training_course/` — 只 read
- `AGENTS.md` / `CLAUDE.md` / `_instructions.md` / `_schema/` / `content/` / `systems/` — 完全只读

## 1.3 禁区

- `projects/1-ai-intel/` 至 `projects/3-sap-content/`
- `projects/5-sap-talent/` 至 `projects/6-biz-ops/`
- 任何 `.obsidian/`
- 任何 `.git/` 内部数据
- 仓库根 `inbox/`

## 1.4 课程产品线红线

当前任务**只**面向 `trackId="jp-foundation"` / 基础线 24 课。
未来扩展目录（`SAP日语培训_中级/` 等）**目前都不存在**。意外发现 → inbox 写 ask 停手。

## 1.5 数据隔离硬底线 ⚠️（Phase 5 引入，Phase 6 加强）

**所有学生 API**：

- 起手 `const session = await auth();` + 401 if no session
- 每条 SQL 带 `where studentId = $session.userId`

**所有讲师 API**：

- 起手 `session.user.role` 必须是 `teacher` 或 `admin`，否则 403
- 讲师 (非 admin) 只能看自己班学生：通过 `enrollments` join 校验
- admin 可看全部学生
- 学生**永远**不能看到别的学生的 recordings / progress events / feedback

## 1.6 凭据 / 二进制硬底线 ⚠️（Phase 6 特别强调）

- `.env.local` 永不入 git
- mp3 / wav / m4a / webm 已 .gitignore
- **R2 Secret Access Key 永不暴露给 client bundle**——只在 server side (`lib/storage/r2.ts`) 用
- **永远不返回 R2 原始 URL 给 client**——必须走 presigned URL
- **presigned PUT TTL ≤ 10 min / GET TTL ≤ 30 min**
- 单录音 ≤ 10 MB（服务端 metadata 校验 + presigned URL 自带 size 限制）

## 1.7 默认拒绝原则

遇到"我要不要碰这个文件 / 这个 API 设计是否安全"的疑问，**默认 NO**。在 inbox 写 ask。

完整版边界见 `logs/codex-working-boundaries.md`。

---

# 第 2 章 · 起手自检

```bash
cd /Users/openclawxiaoer/sap-hub
git branch --show-current           # 必须 main
git status                           # 必须 nothing to commit, working tree clean
git log --oneline | head -10
git log --oneline | grep -iE "phase[- ]?5.*completion"   # 必须命中
```

3 项全过 → 开 Phase 6 分支：

```bash
git checkout -b codex/phase-6-storage
```

任一不过 → `projects/4-sap-training/inbox/need-input-phase6-{YYYYMMDD}.md` 写 ask 停手。

---

# 第 3 章 · Phase 6 凭据前置（R2 4 变量）

**Ryan 已确认会准备** Cloudflare R2 凭据。启动 Phase 6 前你必须先验证 `web/.env.local`
含 4 个 R2 变量 + Phase 5 的 5 个变量都齐：

```bash
cd /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web

# Phase 5 已有的 5 个
grep -c '^DATABASE_URL=' .env.local
grep -c '^RESEND_API_KEY=' .env.local
grep -c '^AUTH_SECRET=' .env.local
grep -c '^AUTH_EMAIL_FROM=' .env.local
grep -c '^NEXTAUTH_URL=' .env.local

# Phase 6 新增 4 个
grep -c '^R2_ACCOUNT_ID=' .env.local
grep -c '^R2_ACCESS_KEY_ID=' .env.local
grep -c '^R2_SECRET_ACCESS_KEY=' .env.local
grep -c '^R2_BUCKET_NAME=' .env.local

# 全部应输出 1（共 9 行）

# .env.local 没进 git
git ls-files .env.local   # 必须输出空
```

任一不满足 → 在
`projects/4-sap-training/inbox/need-input-phase6-creds-{YYYYMMDD}.md` 写 ask 列出
缺失项 + 停手等 Ryan 配齐。

---

# 第 4 章 · 任务包正文（10 子任务）

**Read** 文件 `/Users/openclawxiaoer/sap-hub/logs/codex-phase6-prompt.md`
中「## 任务开始」到「## 任务结束」之间所有内容，按那份正文执行 **10 个子任务**。

执行时**死守**：

1. 第 1 章工作边界，**特别是 1.5 数据隔离 + 1.6 凭据 / 二进制硬底线**
2. **不许编造任何日语句子**
3. **不许把 R2 凭据写进任何 commit / log / 错误消息**
4. **不许跳过 API 的 session 检查 + studentId 隔离 + role 校验**
5. **不许把 R2 原始 URL 返回给 client**（必须 presigned）
6. **不许 presigned PUT TTL > 10 min 或 GET TTL > 30 min**
7. **不许跳过单录音 10 MB 上限校验**
8. **每个子任务一个独立 commit**
9. **不许自动接 Phase 7**

10 个子任务顺序：

1. 装依赖 + R2 凭据 sanity check
2. R2 client lib + presigned URL helpers
3. teacher_feedback 表 migration（0001）
4. 录音 sign + upload + storage_key 写回
5. 学生自己录音列表 API（含 presigned GET URL）
6. 讲师侧录音列表 API（含权限校验 / enrollment 范围 / 筛选）
7. 讲师反馈 API + Resend 邮件通知
8. 讲师 UI 录音列表 + 详情评分表单
9. 学生侧 review 页显示 teacher_feedback
10. _meta.json + 终检 + handoff

---

# 第 5 章 · 完成后做什么

跑通 typecheck / build / dev + 端到端浏览器测试后：

1. 写 handoff 到 `projects/4-sap-training/inbox/handoff-phase-6-{今日 YYYYMMDD}.md`
   按 phase6-prompt.md 第 10.3 节模板填，**重点测**：
   - 学生 A 录音 → R2 看到新文件 → 学生 A 自己听 OK
   - 学生 B 用另一邮箱注册 → 看不到 A 的录音（隔离）
   - 讲师登录 → /teacher/recordings 看到学生 A 录音 → 详情评分提交
   - 学生 A 邮箱收到反馈通知 + /review 看到反馈
   - R2 直链 403 / presigned URL 过期 403

2. **commit** handoff：

   ```bash
   git add projects/4-sap-training/inbox/handoff-phase-6-{YYYYMMDD}.md
   git commit -m "chore(inbox): codex phase-6 handoff record"
   ```

3. **停手**。等 Ryan 上传 handoff 给 Claude 验收。

   - 不要自动接 Phase 7
   - 不要自动合 main
   - 不要自动删分支

---

# 阻塞时停手 SOP

任何下列情况立刻在
`projects/4-sap-training/inbox/need-input-phase6-{YYYYMMDD}-{topic}.md`
写问题并停止：

- 起手 3 项自检任一不过
- `.env.local` 缺 R2 凭据（或 Phase 5 凭据丢失）
- AWS SDK install 失败
- presigned PUT URL 上传 403/404
- 任何 API 漏 session 检查 / 漏 role 校验 / 漏 studentId 隔离
- 学生 A 能看到学生 B 的录音 / progress / feedback（**严重 · 违反 1.5**）
- R2 原始 URL 泄漏给 client（**严重 · 违反 1.6**）
- Resend 邮件通知发不出
- typecheck / build 失败原因看不出

写问题时具体到：哪一步、完整命令 + 输出（**屏蔽凭据**）、你尝试过什么、倾向方案。

---

# 你现在的动作

1. 按第 2 章跑 git 自检 → 通过则开 `codex/phase-6-storage` 分支
2. 按第 3 章验证 .env.local 9 个凭据齐 → 不齐就写 ask 停手
3. Read `/Users/openclawxiaoer/sap-hub/logs/codex-phase6-prompt.md` 的「## 任务开始」到「## 任务结束」之间内容
4. 按那份正文执行 10 个子任务，**每个一个 commit**
5. 完成后按第 5 章写 handoff、停手

**开始动手。**
