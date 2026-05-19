# Codex 工作边界约束 · v1（2026-05-19）

> **所有 Phase 任务包通用前置约束**。Ryan 每次开 Codex 新对话时，先把本文件
> 「## 边界约束（可贴）」段落整段贴给 Codex 作为「段 0」，再贴 git 状态、Phase 前缀、
> Phase 任务包。
>
> 本文件定期更新（新加 Track 时、新 Project 时）。Codex 任何时候发现现实跟本文件
> 冲突，**默认拒绝动手**，在 inbox 写 ask。

---

## 为什么需要这份边界

`sap-hub` 是 Ryan 的**6 个 Project 统一仓库**（1-ai-intel / 2-sap-intel /
3-sap-content / 4-sap-training / 5-sap-talent / 6-biz-ops）。这次 SAP 日语
口语训练平台只是 Project 4 内**当前一个**课程产品线（基础线 24 课）。

未来 Project 4 还会加：
- 中级日语课
- 高级日语课
- SAP 模块专题（FICO / MM / SD / PP / Basis / ABAP）
- 加餐课
- 不同 Track 各自独立的 SAP日语培训源目录

**Codex 容易出的错**：
- 看 `projects/4-sap-training/SAP日语培训_*` 通通当成可读源
- 把别的 Project 当作"反正都在 sap-hub 里就能动"
- 自作主张为「未来扩展」预先生成代码

本边界约束防这 3 类错。

---

## 当前仓库地图（精确实测）

```
/Users/openclawxiaoer/sap-hub/
├── AGENTS.md                              [只读]
├── CLAUDE.md                              [只读]
├── INDEX.md                               [只读]
├── WEB_MOVED.md                           [只读]
├── sap-hub_4号Project_v3_教学产品化.md   [只读 · Ryan 的产品规划档案]
├── _schema/                               [只读 · state 共用 schema]
├── content/                               [只读 · 不属本任务]
├── systems/                               [只读 · 不属本任务]
├── inbox/                                 [只读 · 仓库根级 inbox，不动]
├── logs/                                  [✅ 可写 · 评审/路线图/任务包/handoff 报告]
│
└── projects/
    ├── 1-ai-intel/                        [🚫 完全不许动]
    ├── 2-sap-intel/                       [🚫 完全不许动]
    ├── 3-sap-content/                     [🚫 完全不许动]
    │
    ├── 4-sap-training/                    [⚠️ 本任务工作 Project，但子目录有边界]
    │   ├── _instructions.md               [只读]
    │   ├── sources.yaml                   [只读]
    │   ├── .obsidian/                     [🚫 Obsidian 编辑器状态，已 .gitignore]
    │   │
    │   ├── inbox/                         [✅ 可写 · handoff / need-input 必经]
    │   ├── state/                         [⚠️ 仅更新现有 JSON，不新建]
    │   ├── knowledge/                     [⚠️ 仅 Ryan 的大脑产出区，不要主动写]
    │   │
    │   ├── SAP日语培训/                    [📖 只读 · 11 大目录内容根]
    │   ├── sap_jp_training_course/        [📖 只读 · V4 课程包]
    │   │
    │   └── web/                           [✅ 完全可写 · Next.js 网站源码]
    │       ├── app/  components/  lib/  types/  data/  scripts/  public/
    │       ├── package.json  tsconfig.json  tailwind.config.ts  postcss.config.js
    │       ├── .env.local                 [🔒 凭据 · 永不入 git]
    │       └── .baseline-*/               [✅ 本地备份目录，已 .gitignore]
    │
    ├── 5-sap-talent/                      [🚫 完全不许动]
    └── 6-biz-ops/                         [🚫 完全不许动]
```

---

## 当前课程产品线（**关键**）

当前所有 Phase 任务都只面向 **trackId="jp-foundation" / 基础线 24 课**。

**素材源仅限**两个目录：
- `projects/4-sap-training/SAP日语培训/`
- `projects/4-sap-training/sap_jp_training_course/`

### 未来扩展（**还不存在**，但 Codex 要做好心理准备）

```
projects/4-sap-training/
├── SAP日语培训/                  [当前基础线 24 课]
├── SAP日语培训_中级/              [未来 · trackId="jp-advanced"  · 目前不存在]
├── SAP日语培训_高级/              [未来 · trackId="jp-senior"    · 目前不存在]
├── SAP日语培训_FICO专题/          [未来 · trackId="jp-module-fico" · 目前不存在]
├── SAP日语培训_MM专题/            [未来 · trackId="jp-module-mm"   · 目前不存在]
└── SAP日语培训_加餐/              [未来 · trackId="jp-supplement"  · 目前不存在]
```

**硬规则**：
- 如果 Codex 在 sap-hub 仓库里**看到**任何上述未来目录已存在（Ryan 私下加了内容），
  **不许自动接入它们到 web/data/lessons.json**
- 必须在 `projects/4-sap-training/inbox/need-input-{phase}-new-track-{YYYYMMDD}.md`
  写 ask，等 Ryan 决定何时启动新 Track 的接入
- Phase 1 已经给 Track 模型留好了扩展位（`types/track.ts:TrackId` 是 union 类型，
  `data/tracks.json` 是数组，`buildTracks()` 是函数），但**手动启动**才接入

---

## 边界约束（可贴 · 段 0 用）

> 下面这段从「### 段 0 开始」到「### 段 0 结束」之间所有内容是给 Codex 看的。

### 段 0 开始

【工作边界约束 · 任何 Phase 任务都必须遵守】

你正在为 Ryan 在 sap-hub 仓库工作。sap-hub 是 Ryan 的 6 个 Project 统一仓库
（1-ai-intel / 2-sap-intel / 3-sap-content / 4-sap-training / 5-sap-talent / 6-biz-ops），
你**只**能在 Project 4（SAP 日语培训）下、且仅限「基础线 24 课」当前产品线工作。

【可写区域 · 唯一】

1. `projects/4-sap-training/web/`            — Next.js 网站源码（代码、UI、scripts、data、public）
2. `projects/4-sap-training/web/.env.local`  — 凭据文件，**永不入 git**
3. `projects/4-sap-training/inbox/`          — handoff 文件、need-input 文件
4. `projects/4-sap-training/state/sap_jp_training_course.json` — 仅更新（updated_by/at/completed/links），**不新建** state 文件
5. `logs/`                                    — handoff/报告/任务包/质量报告（但不要乱建新文件，按 Phase 任务包指示）

【只读区域】

- `projects/4-sap-training/SAP日语培训/`     — 11 大目录素材根。**只 read** 用于 buildLessonAssets / extractRealSentences / buildLibrary，**禁止 write/delete/rename**
- `projects/4-sap-training/sap_jp_training_course/` — V4 课程包。同上，只 read
- `AGENTS.md` / `CLAUDE.md` / `_instructions.md` / `_schema/` / `content/` / `systems/` / `sap-hub_4号Project_v3_教学产品化.md` — 完全只读

【禁区 · 绝对不许触碰】

- `projects/1-ai-intel/` ~ `projects/3-sap-content/`
- `projects/5-sap-talent/` ~ `projects/6-biz-ops/`
- 任何 `.obsidian/` 子目录
- 任何 `.git/` 内部数据（除走 git 命令）
- 仓库根 `inbox/`（与 Project 4 的 inbox 不同）

【课程产品线红线】

当前所有 Phase 任务只面向 **trackId="jp-foundation"** / 基础线 24 课。
素材源仅 `SAP日语培训/` + `sap_jp_training_course/` 两个目录。

未来扩展课程线（中级 / 高级 / 模块专题 / 加餐）的目录如：
  `SAP日语培训_中级/` / `SAP日语培训_高级/` / `SAP日语培训_FICO专题/`
  `SAP日语培训_MM专题/` / `SAP日语培训_加餐/`
**目前都不存在**。如果你在仓库里**意外发现**它们存在（Ryan 私下加了），
**不要**自动接入到 web/data/ 或 buildTracks()。立刻在
`projects/4-sap-training/inbox/need-input-{phase}-new-track-{YYYYMMDD}.md`
写明发现 + 等 Ryan 决定。Phase 1 已为扩展留好了 Track 模型位，但接入是**手动**启动。

【convert-content.mjs 路径硬白名单】

`web/scripts/convert-content.mjs` 内允许 `fs.readFileSync` 的源路径仅：

- `path.resolve(root, "../SAP日语培训/output")` 及子目录
- `path.resolve(root, "../sap_jp_training_course/output")` 及子目录

**禁止**用 `glob` / `fs.readdirSync` 递归扫描 Project 4 的其它子目录。
**禁止**新增任何指向 `SAP日语培训_中级` `SAP日语培训_高级` `SAP日语培训_FICO专题`
等未来目录的硬编码路径。

【默认拒绝原则】

遇到任何"我要不要碰这个文件 / 目录"的疑问，**默认 NO**。
在 `projects/4-sap-training/inbox/` 写 ask、停手、等 Ryan 决定。

【动手前 sanity check】

每个 Phase 任务包要求你写文件 / 改文件前，**先**在头脑里跑一遍：

1. 我要写的路径是否在「可写区域」白名单里？
2. 我要读的路径是否在「可写区域」+「只读区域」白名单里？
3. 我要读的路径是否触发"未来扩展课程线"红线？

任一项不确定 → 不写，去 inbox 写 ask。

【段 0 结束】

---

## 给 Ryan 的使用 SOP

每次开 Codex 新对话，按顺序贴 4 段：

### 段 0：边界约束

打开 `/Users/openclawxiaoer/sap-hub/logs/codex-working-boundaries.md`，复制
「### 段 0 开始」到「### 段 0 结束」之间所有内容。

### 段 1：git 状态

跑：

```bash
cd /Users/openclawxiaoer/sap-hub
git log --oneline -10
git branch --show-current
git status
```

把输出贴给 Codex。

### 段 2：Phase 前缀

每个 Phase 任务包有「Phase N 专属前缀」（如 Phase 3 是 TTS 凭据决定），从 Phase
任务包顶部的「Ryan 操作指南」段落复制。

### 段 3：Phase 任务包正文

整段贴 `logs/codex-phase{N}-prompt.md` 的「## 任务开始」到「## 任务结束」之间。

---

## 更新本文件的触发条件（Ryan 自查清单）

✅ Ryan 决定启动新课程产品线（如开第 25 课 / 中级线）→ 更新「未来扩展」段，把对应目录
   从「未来」移到「当前」白名单
✅ Ryan 决定让 Codex 介入第二个 Project（不只是 4）→ 修「禁区」清单
✅ Ryan 新建一类 inbox / state 子目录 → 在「可写区域」加路径
✅ 仓库根 `.gitignore` 重大变更 → 同步反映在本文件的「凭据 / 二进制」描述

每次更新本文件后 commit 一次：

```bash
cd /Users/openclawxiaoer/sap-hub
git add logs/codex-working-boundaries.md
git commit -m "docs: update codex working boundaries (vX.Y)"
```

---

## 边界违反的后果（给 Codex 警告）

如果 Codex 违反边界（写到禁区 / 接入未来 Track / 改了只读文件）：

1. Claude 验收时会立刻发现并拒绝合并
2. Ryan 会 `git revert` 整个 Phase
3. Codex 该 Phase 工作全部作废，重新开分支

所以**宁可在 inbox 写 ask 等 1 小时**，也不要写到禁区。
