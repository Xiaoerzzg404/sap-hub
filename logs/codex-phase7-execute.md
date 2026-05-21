# Phase 7 执行版 · 自给自足

---

## Ryan 用法（极简两步）

### 第一步：commit 本文件 + 准备凭据（可选）

```bash
cd /Users/openclawxiaoer/sap-hub
git add logs/codex-phase7-prompt.md logs/codex-phase7-execute.md
git commit -m "docs: phase-7 execute prompt"
```

**外部凭据准备（全部可选）**：

| 凭据 | 干啥 | 不给会怎样 |
|---|---|---|
| `NEXT_PUBLIC_SENTRY_DSN`（Sentry）| 错误监控 | 子任务 4 写"软依赖"代码，没凭据时 no-op，可上线后随时加 |
| `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`（Upstash Redis）| Rate Limit | 子任务 3 写软依赖，没凭据时 no-op |
| `CRON_SECRET`（自己 `openssl rand -base64 32` 生成）| Vercel Cron 鉴权 | 子任务 6 软删除定时任务跑不了 |

**推荐做法**：

- `CRON_SECRET`：**必须**配（子任务 6 要用），`openssl rand -base64 32` 一行就出
- Sentry / Upstash：**可选**，想接就先去注册，不想就跳过

把凭据加到 `web/.env.local`（**别忘了同步加到 Vercel Project Settings → Environment Variables**，否则生产用不到）。

### 第二步：开 Codex 新对话，发一句话

> 请执行 /Users/openclawxiaoer/sap-hub/logs/codex-phase7-execute.md 中的全部内容。遇到任何阻塞按文件内规则在 inbox 写 ask 停手。

**完。** Codex 接手后自动跑 11 个子任务、commit 11 次、写 handoff，预估 1-1.5 周。

---

> **下面是给 Codex 看的，你不用动。**

---

# 给 Codex 的话

你正在执行 **SAP 日语口语训练平台 Phase 7「上线合规 + 内测扩盘准备」**。

网站已经在 `https://sap-jp.training` 公网上线。Phase 7 跑完 = **可以开第一个班付费招生**。

| 章 | 内容 |
|---|---|
| 1 | 工作边界约束（所有 Phase 通用） |
| 2 | 起手自检 |
| 3 | Phase 7 凭据前置（含可选） |
| 4 | 任务包正文（11 子任务） |
| 5 | 完成后做什么 |

---

# 第 1 章 · 工作边界约束（所有 Phase 通用，最高优先级）

你在 Ryan 的 `sap-hub` 仓库工作。sap-hub 是 6 个 Project 统一仓库
（`1-ai-intel` / `2-sap-intel` / `3-sap-content` / `4-sap-training` / `5-sap-talent` / `6-biz-ops`），
你**只**能在 Project 4 下、且仅限「基础线 24 课」当前产品线工作。

## 1.1 可写区域

1. `projects/4-sap-training/web/` — Next.js 网站源码
2. `projects/4-sap-training/web/.env.local` — 凭据文件，**永不入 git**
3. `projects/4-sap-training/web/lib/db/migrations/` — Drizzle 迁移
4. `projects/4-sap-training/inbox/` — handoff / need-input
5. `projects/4-sap-training/state/sap_jp_training_course.json` — 仅更新现有字段
6. `logs/` — handoff / 报告
7. `.github/workflows/` — GitHub Actions YAML（仓库根级，本 Phase 新增）
8. `projects/4-sap-training/web/docs/` — 3 份用户 docs（本 Phase 新增）

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
未来扩展目录（`SAP日语培训_中级/` 等）目前都不存在。意外发现 → inbox 写 ask 停手。

## 1.5 数据隔离硬底线 ⚠️

所有学生 API：

- `await auth()` + 401 if no session
- `where studentId = $session.userId`

所有讲师 API：

- session.user.role 必须 teacher/admin，否则 403
- 非 admin 时讲师只能看自己班学生

## 1.6 凭据 / 二进制硬底线

- `.env.local` 永不入 git
- 任何 R2 / Sentry / Upstash / Database 凭据**永不**写进 commit / log / 错误消息
- mp3 / wav / m4a / webm 不入 git

## 1.7 安全默认 · Phase 7 加强

- Auth.js maxAge / strategy / cookies 默认配置**不许放宽**
- middleware matcher 不许放过 /api/*
- presigned URL TTL ≤ 已设上限
- Vercel Cron path 必须 Bearer 校验
- 不许实现 user role self-promote endpoint（teacher/admin 必须 SQL 手动 promote）

## 1.8 默认拒绝原则

遇到任何"我要不要碰这个文件/这个设计是否安全"的疑问，**默认 NO**。在 inbox 写 ask。

完整版边界见 `logs/codex-working-boundaries.md`。

---

# 第 2 章 · 起手自检

```bash
cd /Users/openclawxiaoer/sap-hub
git branch --show-current           # 必须 main
git status                           # 必须 nothing to commit, working tree clean
git log --oneline | head -10
git log --oneline | grep -iE "phase[- ]?6.*completion"   # 必须命中
```

3 项全过 → 开 Phase 7 分支：

```bash
git checkout -b codex/phase-7-launch
```

任一不过 → `projects/4-sap-training/inbox/need-input-phase7-{YYYYMMDD}.md` 写 ask 停手。

---

# 第 3 章 · Phase 7 凭据前置

**Ryan 已部署网站到 Vercel**，已配 Phase 5/6 的 9 个 env vars（DATABASE_URL / RESEND / AUTH / R2）。

Phase 7 新增**可能**用到的 env vars（**全部可选**，没有就软依赖空占位）：

```bash
cd /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web

# 软依赖凭据，跑前 check：
grep -c '^CRON_SECRET=' .env.local                   # 子任务 6 用，建议必配
grep -c '^NEXT_PUBLIC_SENTRY_DSN=' .env.local        # 子任务 4 用，可选
grep -c '^UPSTASH_REDIS_REST_URL=' .env.local        # 子任务 3 用，可选
grep -c '^UPSTASH_REDIS_REST_TOKEN=' .env.local      # 子任务 3 用，可选
```

判定：

- 全部为 1 → 全功能接入
- 部分为 1 → 接入有的，没有的写软依赖
- 全部为 0 → 子任务 3/4 写空占位代码，子任务 6 跳过定时任务（手动版仍要）

**不要因为缺凭据而 abort Phase 7**——子任务 3/4 设计就是软依赖。

> sanity check 软警告：lessons.json 体积约 6.1 MB，已知工程债。Phase 7 不解决。

---

# 第 4 章 · 任务包正文（11 子任务）

**Read** 文件 `/Users/openclawxiaoer/sap-hub/logs/codex-phase7-prompt.md`
中「## 任务开始」到「## 任务结束」之间所有内容，按那份正文执行 **11 个子任务**。

执行时**死守**：

1. 第 1 章工作边界，**特别是 1.5 数据隔离 + 1.7 安全默认**
2. **子任务 1（magic link confirm 中间页）必须最先做** —— 这是上线 day-1 踩到的 bug，不修网站对真实用户不可用
3. 不许跳过任何 API 的 session/role 检查
4. 不许把凭据写进 commit 或 log
5. Sentry / Upstash / CRON_SECRET 等**可选**凭据按"软依赖"处理
6. 每个子任务一个独立 commit
7. **不许**自动接 Phase 8（本路线图无 Phase 8，到此正式完结）

11 个子任务大致顺序：

1. **Magic Link Confirm 中间页**（关键 · 优先做）
2. RBAC 守卫复审
3. Upstash Rate Limit（软依赖）
4. Sentry 错误监控（软依赖）
5. 隐私同意 + /privacy 页 + 录音页警示
6. 软删除 recordings + 30 天硬删 cron
7. R2 lifecycle + Neon backup 文档（嵌进 ADMIN_OPS.md）
8. GitHub Actions CI
9. lint + prettier + husky
10. 3 份 docs（STUDENT / TEACHER / ADMIN_OPS）
11. _meta.json 1.4.0 + 终检 + handoff

---

# 第 5 章 · 完成后做什么

跑通 typecheck / build / dev + 端到端真用户测试后：

1. **写 handoff** 到 `projects/4-sap-training/inbox/handoff-phase-7-{今日 YYYYMMDD}.md`
   按 phase7-prompt.md 第 11.3 节模板填，**重点列出**：
   - 11 个 commit hash
   - 凭据接入状态（Sentry / Upstash / CRON_SECRET 哪些有/没有）
   - 端到端测试：yahoo 注册成功（magic link confirm 修了 bug）/ 隐私同意触发 / 软删除触发 / rate limit 触发 429
   - 3 份 docs 行数
   - GitHub Actions CI 是否 PASS（push 一个空 commit 触发）
   - 遗留 / 风险

2. **commit** handoff：

   ```bash
   git add projects/4-sap-training/inbox/handoff-phase-7-{YYYYMMDD}.md
   git commit -m "chore(inbox): codex phase-7 handoff record"
   ```

3. **停手**。等 Ryan 上传 handoff 给 Claude 验收。

   - 不要自动合 main
   - 不要自动删分支
   - 不要自动接任何后续 Phase（路线图到此完结）

---

# 阻塞时停手 SOP

任何下列情况立刻在
`projects/4-sap-training/inbox/need-input-phase7-{YYYYMMDD}-{topic}.md`
写问题并停止：

- 起手 3 项自检任一不过
- 子任务 1 magic link confirm 实现后测试仍 token 失效
- migration 0002 失败
- typecheck / build / lint 失败原因看不出
- Vercel Cron path 设计你不确定是否安全
- 你想给 user 加自动 role promote endpoint（**严禁**，必须 SQL 手动）
- 任何 API 漏 session/role/隔离检查
- Sentry wizard 卡住（可跳过 Sentry 软依赖）
- GitHub Actions CI 在 mock DATABASE_URL 下 build 还是连真 DB

写问题时具体到：哪一步、完整命令 + 输出（**屏蔽凭据**）、你尝试过什么、倾向方案。

---

# 你现在的动作

1. 按第 2 章跑 git 自检 → 通过则开 `codex/phase-7-launch` 分支
2. 按第 3 章 sanity check 凭据，知道哪些是软依赖空占位
3. Read `/Users/openclawxiaoer/sap-hub/logs/codex-phase7-prompt.md` 的「## 任务开始」到「## 任务结束」之间内容
4. **优先做子任务 1**（magic link confirm 中间页 · 关键 bug fix）
5. 然后按 2-11 顺序执行其它子任务，**每个一个 commit**
6. 完成后按第 5 章写 handoff、停手

**开始动手。**
