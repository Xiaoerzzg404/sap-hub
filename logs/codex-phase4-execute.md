# Phase 4 执行版 · 自给自足

---

## Ryan 用法（极简 · 两步）

### 第一步：commit 本文件

```bash
cd /Users/openclawxiaoer/sap-hub
git add logs/codex-phase4-prompt.md logs/codex-phase4-execute.md
git commit -m "docs: phase-4 execute prompt"
```

### 第二步：开 Codex 新对话，发一句话

> 请执行 /Users/openclawxiaoer/sap-hub/logs/codex-phase4-execute.md 中的全部内容。遇到任何阻塞按文件内规则在 inbox 写 ask 停手。

**完。**

---

> **下面是给 Codex 看的，你不用动。**

---

# 给 Codex 的话

你正在执行 **SAP 日语口语训练平台 Phase 4「学生/讲师 UX 重构 + RolePlay 修复」**。

本文是 **完整自给自足** 的任务包。按 5 个章节顺序消费即可，不需要等 Ryan 再说话：

| 章 | 内容 |
|---|---|
| 1 | 工作边界约束（所有 Phase 通用） |
| 2 | 起手自检 |
| 3 | Phase 4 专属前置 |
| 4 | 任务包正文（8 子任务） |
| 5 | 完成后做什么 |

---

# 第 1 章 · 工作边界约束（所有 Phase 通用，最高优先级）

你在 Ryan 的 `sap-hub` 仓库工作。sap-hub 是 6 个 Project 统一仓库
（`1-ai-intel` / `2-sap-intel` / `3-sap-content` / `4-sap-training` / `5-sap-talent` / `6-biz-ops`），
你**只**能在 Project 4（SAP 日语培训）下、且仅限「基础线 24 课」当前产品线工作。

## 1.1 可写区域

1. `projects/4-sap-training/web/` — Next.js 网站源码
2. `projects/4-sap-training/web/.env.local` — 凭据文件，**永不入 git**
3. `projects/4-sap-training/inbox/` — handoff / need-input
4. `projects/4-sap-training/state/sap_jp_training_course.json` — 仅更新现有字段
5. `logs/` — handoff / 报告

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

未来扩展目录（`SAP日语培训_中级/` / `SAP日语培训_高级/` / `SAP日语培训_FICO专题/` 等）
**目前都不存在**。如果你意外发现它们已经存在，**不要**接入到 web/data/lessons.json
或 buildTracks()。立刻在
`projects/4-sap-training/inbox/need-input-phase4-new-track-{YYYYMMDD}.md`
写 ask + 停手等 Ryan。

## 1.5 `convert-content.mjs` 路径硬白名单

允许 `fs.readFileSync` 的源路径**仅限**：

- `path.resolve(root, "../SAP日语培训/output")` 及子目录
- `path.resolve(root, "../sap_jp_training_course/output")` 及子目录

**禁止**用 `glob` / `fs.readdirSync` 递归扫描 Project 4 其它子目录。
**禁止**硬编码任何指向未来扩展课程线目录的路径。

## 1.6 默认拒绝原则

遇到"我要不要碰这个文件"的疑问，**默认 NO**。在 inbox 写 ask、停手、等 Ryan。

完整版边界见 `logs/codex-working-boundaries.md`。

---

# 第 2 章 · 起手自检

```bash
cd /Users/openclawxiaoer/sap-hub
git branch --show-current           # 必须 main
git status                           # 必须 nothing to commit, working tree clean
git log --oneline | head -10
git log --oneline | grep "phase-3 MVP rescue completion"   # 必须命中
```

3 项必须全过：

- `branch=main`
- working tree clean
- 历史里能看到 `phase-3 MVP rescue completion`

**不校验 hash 完全一致**——main HEAD 可能在 `1ae428c chore(inbox): codex phase-3 handoff record`
之后又有 docs commits（包括本 Phase 4 prompt 的 commit）。

任一不满足 → `projects/4-sap-training/inbox/need-input-phase4-{YYYYMMDD}.md` 写明并停手。

通过 → 开 Phase 4 分支：

```bash
git checkout -b codex/phase-4-ux
```

---

# 第 3 章 · Phase 4 专属前置

**无需 Ryan 决定的事**——直接动手。

只有一个 sanity check：跑 dev 服务器之前先看一眼 lessons.json 大小。Phase 3 去生造后
体积应该已经缩小：

```bash
cd /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web
ls -lah data/lessons.json
```

期望 < 5 MB（Phase 1 时是 6.95 MB，Phase 3 去生造后预计 3-4 MB）。如果 > 6 MB
说明转换脚本有问题，停手在 inbox 写 ask。

---

# 第 4 章 · 任务包正文（8 子任务）

**Read** 文件 `/Users/openclawxiaoer/sap-hub/logs/codex-phase4-prompt.md`
中「## 任务开始」到「## 任务结束」之间所有内容，按那份正文执行 **8 个子任务**。

执行时**死守**：

1. 第 1 章工作边界
2. **不许编造任何日语句子**（子任务 8 RolePlay 解析时尤其要注意，宁可覆盖 < 24 课也不放宽 isRealJapanese）
3. **不许装新 npm 依赖**（lucide-react 已有；不要装 next-themes / shadcn / @tailwindcss/typography 等）
4. **不许升级现有依赖**
5. **不许接 Auth / DB / S3**（Phase 5/6）
6. **不许**改 `web/.env.local` 或动 mp3 / audio
7. **每个子任务一个独立 commit**（commit message 已在 phase4-prompt.md 子任务节给出）
8. **不许自动接 Phase 5**

8 个子任务大致顺序：

1. LessonStepper 组件
2. Lesson 详情页用 Stepper 包裹
3. Dashboard 5-step timeline + 最近 7 天活跃度
4. 首页 3 卡片轻入口 + 免责声明
5. 讲师专区 banner + 主位重排
6. 移动端响应式（MobileNav 抽屉）
7. i18n 日语字体（lang="ja" + Hiragino/Yu Gothic）
8. RolePlay 内容解析重写（Phase 3 遗留 0 条问题）

---

# 第 5 章 · 完成后做什么

跑通 typecheck / build / dev / 浏览器手测 5 页 + 移动 375px + 日语字体 sanity check 后：

1. 写 handoff 到 `projects/4-sap-training/inbox/handoff-phase-4-{今日 YYYYMMDD}.md`
   按 phase4-prompt.md 终检节模板填，**重点写**：
   - 8 个 commit hash 列表
   - roleplays.json items 数 + 覆盖课次数
   - typecheck / build 状态
   - 5 页浏览器手测结果（每页一句话）
   - 移动 375px 抽屉验证
   - 日语 computed font sanity（PASS / FAIL）
   - First Load JS 大小（若 > 600 KB 标黄等 Phase 5 处理）
   - 遗留 / 风险

2. **commit** handoff：

   ```bash
   git add projects/4-sap-training/inbox/handoff-phase-4-{YYYYMMDD}.md
   git commit -m "chore(inbox): codex phase-4 handoff record"
   ```

3. **停手**。等 Ryan 把 handoff 上传给 Claude 验收。

   - 不要自动接 Phase 5
   - 不要自动合 main
   - 不要自动删分支

---

# 阻塞时停手 SOP

任何下列情况立刻在
`projects/4-sap-training/inbox/need-input-phase4-{YYYYMMDD}-{topic}.md`
写问题并停止：

- 起手 3 项自检任一不过
- 子任务 8 跑完 roleplays 覆盖 < 8 课
- typecheck / build 失败且原因看不出
- 任一手测页面 console 出现非 audio 红色 error
- 移动 375px 下 Header drawer 不能弹出
- 日语 computed font 还是 PingFang / STSong（说明 globals.css 没生效）
- 你想动 1.3 节「禁区」目录里的文件
- 你发现 1.4 节「未来扩展课程线」目录已存在

写问题时具体到：哪一步、完整命令 + 输出、你尝试过什么、倾向方案。**不要猜。**

---

# 你现在的动作

1. 按第 2 章跑 git 自检 → 通过则开 `codex/phase-4-ux` 分支
2. 按第 3 章跑 lessons.json 体积 sanity check
3. Read `/Users/openclawxiaoer/sap-hub/logs/codex-phase4-prompt.md` 的「## 任务开始」到「## 任务结束」之间内容
4. 按那份正文执行 8 个子任务，**每个一个 commit**
5. 完成后按第 5 章写 handoff、停手

**开始动手。**
