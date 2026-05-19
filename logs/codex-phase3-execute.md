# Phase 3 执行版 · 自给自足

---

## Ryan 用法（极简 · 两步）

### 第一步：commit 本文件

```bash
cd /Users/openclawxiaoer/sap-hub
git add logs/codex-phase3-execute.md
git commit -m "docs: phase-3 execute prompt (self-contained)"
```

### 第二步：开 Codex 新对话，发一句话

> 请执行 /Users/openclawxiaoer/sap-hub/logs/codex-phase3-execute.md 中的全部内容。
> 遇到任何阻塞按文件内规则在 inbox 写 ask 停手。

**完。** Codex 会自己读完所有章节、自检、动手、commit、写交接、停在等你验收。

---

> **下面是给 Codex 看的，你不用动。**

---

# 给 Codex 的话

你正在执行 **SAP 日语口语训练平台 Phase 3「本地训练 MVP 救活」**。

本文是 **完整自给自足** 的任务包。按 5 个章节顺序消费即可，不需要等 Ryan 再说话：

| 章节 | 内容 | 你在这一章做什么 |
|---|---|---|
| 1 | 工作边界约束（所有 Phase 通用） | 把规则刻进脑子 |
| 2 | 起手自检 | 跑 git 命令确认基线 |
| 3 | TTS 凭据决定 | 起手就在 inbox 写 ask，**或** Ryan 已选定路径就照走 |
| 4 | 任务包正文（11 个子任务，4-5 天） | Read `logs/codex-phase3-prompt.md` 按里面执行 |
| 5 | 完成后做什么 | 写 handoff，停手 |

---

# 第 1 章 · 工作边界约束（所有 Phase 通用，最高优先级）

你在 Ryan 的 `sap-hub` 仓库工作。`sap-hub` 是 Ryan 的 **6 个 Project 统一仓库**
（`1-ai-intel` / `2-sap-intel` / `3-sap-content` / `4-sap-training` / `5-sap-talent` / `6-biz-ops`），
你**只**能在 Project 4（SAP 日语培训）下、且仅限「基础线 24 课」当前产品线工作。

## 1.1 可写区域（白名单）

1. `projects/4-sap-training/web/` — Next.js 网站源码（代码、UI、scripts、data、public）
2. `projects/4-sap-training/web/.env.local` — 凭据文件，**永不入 git**
3. `projects/4-sap-training/inbox/` — handoff / need-input 文件
4. `projects/4-sap-training/state/sap_jp_training_course.json` — 仅更新现有字段，**不新建** state 文件
5. `logs/` — handoff / 报告 / 质量记录（按 Phase 任务包指示，不主动多建）

## 1.2 只读区域

- `projects/4-sap-training/SAP日语培训/` — 11 大目录素材根，**只 read**，禁止 write/delete/rename
- `projects/4-sap-training/sap_jp_training_course/` — V4 课程包，**只 read**
- `AGENTS.md` / `CLAUDE.md` / `_instructions.md` / `_schema/` / `content/` / `systems/` — 完全只读
- 仓库根 `WEB_MOVED.md` / `INDEX.md` / `sap-hub_4号Project_v3_教学产品化.md` — 只读

## 1.3 禁区（绝对不许触碰）

- `projects/1-ai-intel/` 至 `projects/3-sap-content/`
- `projects/5-sap-talent/` 至 `projects/6-biz-ops/`
- 任何 `.obsidian/` 子目录（Obsidian 编辑器状态，已 .gitignore）
- 任何 `.git/` 内部数据（除走标准 git 命令）
- 仓库根 `inbox/`（与 `projects/4-sap-training/inbox/` 不同）

## 1.4 课程产品线红线 ⚠️

当前所有 Phase 任务**只**面向 **`trackId="jp-foundation"` / 基础线 24 课**。

素材源仅限两个目录：

- `projects/4-sap-training/SAP日语培训/`
- `projects/4-sap-training/sap_jp_training_course/`

未来可能扩展的课程线目录（如下）**目前都不存在**：

- `SAP日语培训_中级/`
- `SAP日语培训_高级/`
- `SAP日语培训_FICO专题/`
- `SAP日语培训_MM专题/`
- `SAP日语培训_加餐/`

如果你在仓库里**意外发现**它们已经存在（Ryan 私下加了），**不要**：

- 自动接入到 `web/data/lessons.json`
- 在 `buildTracks()` 数组里新增 Track
- 在 `convert-content.mjs` 里加路径

正确动作：立刻在
`projects/4-sap-training/inbox/need-input-phase3-new-track-{YYYYMMDD}.md`
写明发现 + 停手等 Ryan。Phase 1 已为扩展留好模型位，但**接入是手动启动**。

## 1.5 `convert-content.mjs` 路径硬白名单

`web/scripts/convert-content.mjs` 内允许 `fs.readFileSync` 的源路径**仅限**：

- `path.resolve(root, "../SAP日语培训/output")` 及子目录
- `path.resolve(root, "../sap_jp_training_course/output")` 及子目录

**禁止**用 `glob` / `fs.readdirSync` 递归扫描 Project 4 其它子目录。
**禁止**硬编码任何指向未来扩展课程线目录的路径。

## 1.6 默认拒绝原则

遇到任何"我要不要碰这个文件/目录"的疑问，**默认 NO**。
在 `projects/4-sap-training/inbox/` 写 ask、停手、等 Ryan 决定。

完整版边界细节见 `/Users/openclawxiaoer/sap-hub/logs/codex-working-boundaries.md`。

---

# 第 2 章 · 起手自检

跑以下命令，自己确认基线：

```bash
cd /Users/openclawxiaoer/sap-hub
git branch --show-current
git status
git log --oneline | head -10
git log --oneline | grep "phase-2 asset binding completion"
```

**3 项必须全过**：

- `branch=main`
- `git status` 是 `nothing to commit, working tree clean`
- `git log` 历史里能看到 `phase-2 asset binding completion`

期望 main HEAD 在 commit `57fb222 docs: phase-3 task prompt` 或之后若干格
（Ryan 可能 commit 了 boundaries.md / execute.md 等 docs commits，导致 HEAD 漂移）。
**不校验 hash 完全一致**，只校验上面 3 项。

任一不满足 → 在
`projects/4-sap-training/inbox/need-input-phase3-{YYYYMMDD}.md` 写明并停手。

3 项全过 → 开 Phase 3 分支：

```bash
cd /Users/openclawxiaoer/sap-hub
git checkout -b codex/phase-3-mvp-rescue
```

---

# 第 3 章 · TTS 路径已决定 · 选 C（Ryan 已拍板）

**Ryan 已经决定**：Phase 3 **暂时不跑 TTS**，你只把脚本写好 commit。

## 你要做的（覆盖 phase3-prompt.md 子任务 0）

1. **不要**在 inbox 写 TTS ask 停手 —— Ryan 已经选好了，直接动手
2. **不要**真跑 `npm run tts`
3. **不要**碰 `web/.env.local`（凭据 Ryan 后续自己配）

## 具体口径

- **子任务 3**：写 `scripts/generate-tts.mjs` + 给 `package.json` 加 `scripts.tts: "node scripts/generate-tts.mjs"` + 创建占位目录（`web/public/audio/phrase/.gitkeep` / `shadowing/.gitkeep` / `term/.gitkeep`）+ commit。**到此为止**，不要执行 `npm run tts`。

- **scripts/generate-tts.mjs 健壮性要求**（防 Ryan 后续误跑炸掉）：
  - 顶部检测 `if (!process.env.AZURE_SPEECH_KEY && !process.env.OPENAI_API_KEY && process.env.TTS_PROVIDER !== "skip") { console.error("ERROR: 凭据缺失。配置 web/.env.local 后重跑，或设置 TTS_PROVIDER=skip 空跑。"); process.exit(1); }`
  - `TTS_PROVIDER=skip` 模式下脚本只打印将要生成的目标列表然后 `process.exit(0)`，**不**真发请求
  - 这样 Ryan 后续可以先用 `TTS_PROVIDER=skip npm run tts` 干跑验证脚本能跑、再配凭据真跑

- **子任务 4**（更新 audioSrc 路径）：让 `convert-content.mjs` 输出的 audioSrc 已经指向最终目标 `/audio/phrase/{id}.mp3` / `/audio/shadowing/{id}.mp3` / `/audio/term/{id}.mp3`，**不要**继续指 `/audio/placeholders/...`

- **验收时**：浏览器跑 dev server 会看到 audio 404 警告（因为 mp3 文件还没生成）。**这属预期，不算 Phase 3 失败**。Ryan 后续配凭据跑 TTS 后 404 自然消失。你不要为了清掉 404 而妥协（不要提交 placeholder mp3 / 不要把 audioSrc 改回 placeholders / 不要往 git 里 commit 任何 mp3）。

- **handoff** 末尾的「下一步 / Phase 3.5」段落明确写一行：

  > Phase 3.5 待 Ryan 自己跑：在 web/.env.local 配 AZURE_SPEECH_KEY / AZURE_SPEECH_REGION=japaneast / AZURE_TTS_VOICE=ja-JP-NanamiNeural 后跑 `cd web && npm run tts`，预计 5-20 分钟生成 240+ mp3 到 web/public/audio/。mp3 已 .gitignore 排除不入库。

## 自检：起手验证你看到 Ryan 的选 C 决定

读到本章你应当：

- 知道 Phase 3 **不写** `inbox/need-input-phase3-tts-*.md`
- 知道 `npm run tts` **不执行**
- 知道 Phase 3 验收时 audio 404 **不阻塞**

直接进第 4 章开干。

---

# 第 4 章 · 任务包正文（11 个子任务）

**Read** 文件 `/Users/openclawxiaoer/sap-hub/logs/codex-phase3-prompt.md` 中
「## 任务开始」到「## 任务结束」之间所有内容，**按那份正文执行 11 个子任务**。

正文里的「起手自检」「TTS 凭据问询」已经在本文件第 2 章和第 3 章覆盖更新，你按本文件
第 2/3 章为准。

正文里的「严禁清单」「阻塞清单」**都照办**。

执行时**死守**：

1. 第 1 章工作边界（特别是 `convert-content.mjs` 路径白名单）
2. **不许编造任何日语句子**（N 节真实性硬底线 · 违反整 Phase abort）
3. **不许装新 npm 依赖**（除 phase3-prompt.md 明确允许的 react-markdown 等已 commit 的依赖）
4. **不许接 Auth / DB / S3**（那是 Phase 5/6）
5. **不许**把 `.env.local` 或 mp3 文件 commit 进 git
6. **每个子任务一个独立 commit**（commit message 已在 phase3-prompt.md 子任务节给出）
7. **不许自动接 Phase 4**

子任务 1 完成 → commit → 子任务 2，依次。

任务量：8-10 个 commit。预估 4-5 天。

---

# 第 5 章 · 完成后做什么

跑通所有验证（typecheck / build / 浏览器手测 5 页）后：

1. **写 handoff** 到 `projects/4-sap-training/inbox/handoff-phase-3-{今日 YYYYMMDD}.md`
   按 `codex-phase3-prompt.md` 第 10.5 节模板填，关键填这几项：
   - 完成的 8-10 个 commit hash 列表
   - 验收清单（每条 P0/P1/P2 修复项打 ✅）
   - `content-source-report.md` 摘要（贴关键统计）
   - `data/_meta.json` 摘要
   - 验收命令清单（给 Claude）
   - 遗留 / 风险（写下任何你不确定的）

2. **commit** handoff 文件：

   ```bash
   git add projects/4-sap-training/inbox/handoff-phase-3-{YYYYMMDD}.md
   git commit -m "chore(inbox): codex phase-3 handoff record"
   ```

3. **停手**。等 Ryan 把 handoff 上传给 Claude 验收。

   - 不要自动接 Phase 4
   - 不要自动合 main（Ryan 验收通过才合）
   - 不要自动删分支

---

# 阻塞时停手 SOP（重要）

任何下列情况立刻在
`projects/4-sap-training/inbox/need-input-phase3-{YYYYMMDD}-{topic}.md`
写问题并停止：

- 起手 3 项自检任一不过
- TTS 凭据没拿到（且 Ryan 没明确说选 C）
- 子任务 1 跑完发现 ≥ 5 课 0 真句
- 子任务 2 抽检 20 句有 ≥ 1 句含连续 6+ 中文短语（违反 N 节真实性）
- typecheck / build 失败且原因看不出
- 任一手测页面 console 出红色 error（audio 404 警告除外）
- 你想动 1.3 节「禁区」目录里的任何文件
- 你发现 1.4 节「未来扩展课程线」目录已存在（Ryan 私下加了内容）

写问题时具体到：

1. 哪一步 / 哪个子任务
2. 完整命令 + 完整输出（不要只贴片段）
3. 你尝试过什么
4. 倾向的两个解决方案

**不要猜。等 Ryan 决定。**

---

# 你现在的动作

你已经读完全部 5 章 + 阻塞 SOP。

1. 按第 2 章跑 git 自检命令 → 通过则开 `codex/phase-3-mvp-rescue` 分支
2. 按第 3 章写 TTS ask（或直接照 Ryan 已选路径走）
3. **Read** `/Users/openclawxiaoer/sap-hub/logs/codex-phase3-prompt.md` 的「## 任务开始」到「## 任务结束」之间内容
4. 按那份正文执行 11 个子任务，**每个一个 commit**
5. 完成后按第 5 章写 handoff、停手

**开始动手。**
