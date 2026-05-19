# Phase 5 执行版 · 自给自足

---

## Ryan 用法（极简两步）

### 第一步：commit 本文件 + 准备凭据

```bash
cd /Users/openclawxiaoer/sap-hub
git add logs/codex-phase5-prompt.md logs/codex-phase5-execute.md
git commit -m "docs: phase-5 execute prompt"
```

**外部凭据准备（路径 A，你已选）**：

1. 去 https://neon.tech 开免费 Postgres 项目，拿 `DATABASE_URL=postgres://...?sslmode=require`
2. 去 https://resend.com 注册，给一个 verified domain（或先用 resend 提供的 onboarding@resend.dev 临时发件人）；拿 `RESEND_API_KEY=re_...`
3. 跑 `openssl rand -base64 32` 生成 `AUTH_SECRET`
4. 把 4 个变量写到 `/Users/openclawxiaoer/sap-hub/projects/4-sap-training/web/.env.local`：

```
DATABASE_URL=postgres://...?sslmode=require
RESEND_API_KEY=re_...
AUTH_SECRET=<上面 openssl 输出>
AUTH_EMAIL_FROM=onboarding@resend.dev
NEXTAUTH_URL=http://localhost:3000
```

> `.env.local` 已 .gitignore 永不入库，安全。

### 第二步：开 Codex 新对话，发一句话

> 请执行 /Users/openclawxiaoer/sap-hub/logs/codex-phase5-execute.md 中的全部内容。遇到任何阻塞按文件内规则在 inbox 写 ask 停手。

**完。**

---

> **下面是给 Codex 看的，你不用动。**

---

# 给 Codex 的话

你正在执行 **SAP 日语口语训练平台 Phase 5「Auth + Postgres + 服务端基座」**。

这是路线图**最重的一阶段**——从纯前端 alpha 变成真后端 MVP。10 个子任务，
预估 1.5-2 周。

| 章 | 内容 |
|---|---|
| 1 | 工作边界约束（所有 Phase 通用） |
| 2 | 起手自检 |
| 3 | Phase 5 凭据前置（路径 A 已锁定） |
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
3. `projects/4-sap-training/web/lib/db/migrations/` — Drizzle 生成的 SQL 迁移
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
- 任何 `.git/` 内部数据（除走 git 命令）
- 仓库根 `inbox/`

## 1.4 课程产品线红线 ⚠️

当前所有 Phase 任务**只**面向 `trackId="jp-foundation"` / 基础线 24 课。
素材源仅限：

- `projects/4-sap-training/SAP日语培训/`
- `projects/4-sap-training/sap_jp_training_course/`

未来扩展目录（`SAP日语培训_中级/` / `SAP日语培训_高级/` 等）**目前都不存在**。
如果意外发现存在，**不要**接入。立刻在
`projects/4-sap-training/inbox/need-input-phase5-new-track-{YYYYMMDD}.md` 写 ask 停手。

## 1.5 数据隔离硬底线 ⚠️（Phase 5 新增）

所有 API route handler 必须：

1. 起手 `const session = await auth();` 拿 session
2. 如果 `!session?.user?.id` → 返回 401
3. **每条 SQL** 必须带 `where studentId = $session.userId`（讲师 API 允许 join enrollments 拿"我下属学生"，但讲师不能跨 enrollment 看别的班）
4. 学生不能改自己的 role（不能 PATCH /api/users/me 把自己升 teacher）
5. role promote 只能 Ryan 手动 SQL 跑

违反任一条 → 整 Phase abort 重做。

## 1.6 凭据 / 二进制 / mp3 ✅

- `.env.local` 永不入 git
- mp3 / wav / m4a 已 .gitignore
- DATABASE_URL / RESEND_API_KEY 不许写进任何 git tracked 文件（包括 commit message）

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
git log --oneline | grep "phase-4 UX completion"   # 必须命中
```

3 项全过 → 开 Phase 5 分支：

```bash
git checkout -b codex/phase-5-backend
```

---

# 第 3 章 · Phase 5 凭据前置（路径 A · Ryan 已锁定）

**Ryan 已确认会准备** Neon Postgres + Resend 邮件 + Auth Secret。
启动 Phase 5 前你必须先验证 `web/.env.local` 4 个变量都就绪：

```bash
cd /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web

# 1. .env.local 存在
ls .env.local

# 2. 4 个变量都在
grep -c '^DATABASE_URL=' .env.local
grep -c '^RESEND_API_KEY=' .env.local
grep -c '^AUTH_SECRET=' .env.local
grep -c '^AUTH_EMAIL_FROM=' .env.local
# 全部应输出 1

# 3. .env.local 没进 git
git ls-files .env.local
# 必须输出空
```

任一不满足 → 在
`projects/4-sap-training/inbox/need-input-phase5-creds-{YYYYMMDD}.md` 写 ask 列出
缺失项 + 停手等 Ryan 配齐。

> sanity check 软警告：lessons.json 现仍约 6.1 MB，已知工程债（assets[].markdown 内嵌），
> Phase 5 子任务 9「数据按需拆分」会一起修。不阻塞起手。

---

# 第 4 章 · 任务包正文（10 子任务）

**Read** 文件 `/Users/openclawxiaoer/sap-hub/logs/codex-phase5-prompt.md`
中「## 任务开始」到「## 任务结束」之间所有内容，按那份正文执行 **10 个子任务**。

执行时**死守**：

1. 第 1 章工作边界，**特别是 1.5 数据隔离硬底线**
2. **不许编造任何日语句子**（虽然 Phase 5 主要是后端，但 seed 脚本不能修改 data 内容）
3. **不许把 .env.local 凭据写进任何 commit / log / 错误消息**
4. **不许跳过 API 的 session 检查 + studentId 隔离**
5. **每个子任务一个独立 commit**
6. **不许接 S3 / R2**（Phase 6）
7. **不许自动 promote 任何 user 到 teacher / admin role**
8. **不许自动接 Phase 6**

10 个子任务顺序：

1. 装依赖 + scripts
2. Drizzle schema 19 张表 + migrate
3. Seed 脚本 + 灌内容
4. Auth.js v5 + Resend magic link
5. 登录页 + 验证页 + middleware 守卫
6. progress events API + progress-storage 改 fetch
7. 录音 metadata API + RecordingPanel 接入
8. content-loader 改 DB-backed
9. 数据按需拆分修 First Load JS
10. _meta.json + 终检 + handoff

---

# 第 5 章 · 完成后做什么

跑通 typecheck / build / dev + 浏览器手测（含真注册-登录-录音流程）后：

1. 写 handoff 到 `projects/4-sap-training/inbox/handoff-phase-5-{今日 YYYYMMDD}.md`
   按 phase5-prompt.md 第 10.3 节模板填，重点写：
   - 10 个 commit hash 列表
   - DB 灌入数据 counts
   - First Load JS（before vs after，每页 < 500 KB）
   - 浏览器手测（注册-登录-录音 全流程 + /teacher 路由守卫 + 学生 A vs B 隔离）
   - 遗留 / 风险

2. **commit** handoff：

   ```bash
   git add projects/4-sap-training/inbox/handoff-phase-5-{YYYYMMDD}.md
   git commit -m "chore(inbox): codex phase-5 handoff record"
   ```

3. **停手**。等 Ryan 把 handoff 上传给 Claude 验收。

   - 不要自动接 Phase 6
   - 不要自动合 main
   - 不要自动删分支

---

# 阻塞时停手 SOP

任何下列情况立刻在
`projects/4-sap-training/inbox/need-input-phase5-{YYYYMMDD}-{topic}.md`
写问题并停止：

- 起手 3 项自检任一不过
- `.env.local` 缺凭据
- `drizzle:generate` / `drizzle:migrate` 失败
- `seed-db` counts 不达预期
- typecheck / build 失败原因看不出
- middleware 守卫不生效
- 学生 A 能看到学生 B 的录音 / progress events（**严重 · 违反 1.5 节隔离**）
- 任何 API 漏 session 检查
- Resend 邮件发不出（API 错 / domain 不验证）

写问题时具体到：哪一步、完整命令 + 输出（**屏蔽凭据**）、你尝试过什么、倾向方案。

---

# 你现在的动作

1. 按第 2 章跑 git 自检 → 通过则开 `codex/phase-5-backend` 分支
2. 按第 3 章验证 .env.local 4 个凭据齐 → 不齐就写 ask 停手
3. Read `/Users/openclawxiaoer/sap-hub/logs/codex-phase5-prompt.md` 的「## 任务开始」到「## 任务结束」之间内容
4. 按那份正文执行 10 个子任务，**每个一个 commit**
5. 完成后按第 5 章写 handoff、停手

**开始动手。**
