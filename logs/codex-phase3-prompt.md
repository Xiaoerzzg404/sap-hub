# Codex 任务包 · Phase 3「本地训练 MVP 救活」

> **Ryan 操作指南**（你看完这一段就把任务包贴给 Codex 新对话）：
>
> 1. **新开 Codex 对话**（强烈建议——Phase 2 老对话压缩后会丢硬约束，Phase 3 任务最重，新对话最稳）
> 2. 把这份 prompt commit 到 git 后再贴给 Codex：
>    ```bash
>    cd /Users/openclawxiaoer/sap-hub
>    git add logs/codex-phase3-prompt.md
>    git commit -m "docs: phase-3 task prompt"
>    git log --oneline -3
>    ```
> 3. 新 Codex 对话里**先贴这段 git 状态**（让 Codex 看见基线）：
>    ```bash
>    git log --oneline -10
>    git branch --show-current
>    git status
>    ```
> 4. 然后整段贴下方「## 任务开始」到「## 任务结束」之间所有内容
> 5. **不要**自己在对话里说"你之前是 Codex / 我们做了 Phase 0-2"——任务包里都写清楚了
>
> 预计耗时 **4-5 天**，11 个子任务。中间 Codex 可能会问你要 TTS 凭据；如果你不想现在弄 Azure / OpenAI 账号，可以告诉 Codex "Phase 3 跑完后我自己另起一轮 TTS 生成"——Codex 会把生成脚本写好但不跑。

---

## 任务开始

你是 Codex 新对话。本任务包是**自包含**的——不需要你记得任何之前对话内容。
所有上下文都在以下文件 + git 历史里。

### 这一 Phase 干什么

把评审报告里所有 P0/P1/P2 的硬伤一次性修完，做完后**本地单人**学生能完成完整闭环：
听 → 跟 → 录 → 回 → 评 → 复盘。

具体修复 11 项（顺序就是子任务编号）：

| 严重度 | 内容 | 子任务 |
|---|---|---|
| P0-1 | 真音频 TTS 脚本（240+ 音频生成） | 子任务 3 |
| P0-2 | 内容去日语生造（最敏感，触及 N 节硬底线） | 子任务 1+2 |
| P0-3 | 讲师专区学生录音占位（StudentRecordingReview 替换为警告卡） | 子任务 8 |
| P0-6 | 文本作业 textarea 输入即丢 | 子任务 9 |
| P1-1 | Dashboard 永远显示 lesson_01 | 子任务 5（含进度条） |
| P1-3 | Lesson 详情页进度条永远 0% | 子任务 5（含 Dashboard） |
| P1-5 | WaveformVisualizer 是假波形 | 子任务 6（含 blob 修复） |
| P1-6 | blob URL 不该写库 | 子任务 6（含波形） |
| P2-1 | 自评分数从未写进 progress.selfAssessments | 子任务 7（含收藏 key） |
| P2-2 | 收藏 key 命名不闭环（favoriteSentences vs favoritePhrases） | 子任务 7（含自评） |
| 收尾 | `data/_meta.json` + content-source-report.md 自检 | 子任务 10 |

**本 Phase 不接 Auth / DB / S3**——那是 Phase 5/6。
**本 Phase 录音仍存浏览器 IndexedDB**——只是修 bug，不动存储后端。

### 必读（按顺序读完再动手）

1. `/Users/openclawxiaoer/sap-hub/AGENTS.md`
2. `/Users/openclawxiaoer/sap-hub/projects/4-sap-training/_instructions.md`
3. `/Users/openclawxiaoer/sap-hub/logs/codex-evolution-roadmap.md` 的 **Phase 3 节**
4. `/Users/openclawxiaoer/sap-hub/logs/claude-code-speaking-platform-review.md`
   重点：Critical Findings 全部 P0/P1/P2 条目
5. `/Users/openclawxiaoer/sap-hub/projects/4-sap-training/inbox/handoff-phase-2-20260519.md`
   （上一阶段 handoff，了解 Phase 2 刚做完什么）

读完每份文件你应该知道：
- 网站现在的目录结构（在 `projects/4-sap-training/web/`）
- 三层数据模型（Track → Level → Lesson → assets[]）
- 24 课每课已经挂了 10 份 markdown asset 可以 grep 真日语句
- 录音用 IndexedDB（`lib/audio-storage.ts`）+ 进度用 localStorage（`lib/progress-storage.ts`）
- **N 节硬底线**：禁止编造任何日语句子；找不到真句必须跳过

### 工作目录

```bash
cd /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web
```

注意 sap-hub 根目录已经只剩 `logs/` `inbox/` `projects/` `WEB_MOVED.md` `AGENTS.md` `CLAUDE.md` `_schema` `systems` `content` 等，**网站源码在 `projects/4-sap-training/web/`**。

### 起手自检

```bash
cd /Users/openclawxiaoer/sap-hub
git branch --show-current     # 必须是 main
git status                    # 必须 clean
git log --oneline | grep "phase-2 asset binding completion"
# 必须命中（不校验完整 hash，只确认历史里有这条 commit）
```

任一条件不满足 → `projects/4-sap-training/inbox/need-input-phase3-{今日 YYYYMMDD}.md`
写明并停手。

### 开分支

```bash
cd /Users/openclawxiaoer/sap-hub
git checkout -b codex/phase-3-mvp-rescue
```

---

## 子任务 0 · TTS 凭据前置问询

> **重要**：本子任务**仅在 Ryan 没有提前给凭据**时触发。如果 Ryan 在贴任务包时
> 已经在对话里告诉你 Azure / OpenAI 凭据（或者明确说"Phase 3 跑完后再自己生成 TTS"），
> 跳过本节，子任务 3 的脚本写好但不真跑即可。

如果对话里 Ryan 没明确指示 TTS 路径，你需要：

1. 在 `projects/4-sap-training/inbox/need-input-phase3-tts-{YYYYMMDD}.md` 写下询问：
   ```markdown
   # Phase 3 TTS 凭据问询

   Phase 3 子任务 3 需要生成 240+ 音频 mp3 文件。选项：

   ## A. 你（Ryan）提供 Azure Speech 凭据（推荐）
   - 你在 https://portal.azure.com 创建 Speech Service（free F0 每月 50 万字符免费）
   - 把 KEY 和 REGION 写到 web/.env.local：
     AZURE_SPEECH_KEY=...
     AZURE_SPEECH_REGION=japaneast
     AZURE_TTS_VOICE=ja-JP-NanamiNeural
   - 我（Codex）写好 scripts/generate-tts.mjs + 跑一次完整生成
   - 跑完 240+ mp3 落 web/public/audio/，.gitignore 排除不进库

   ## B. 你提供 OpenAI tts-1 凭据
   - OPENAI_API_KEY=sk-...
   - 我用 OpenAI tts-1 voice="nova" 跑（日语口音稍重）

   ## C. 我只写脚本不跑 TTS（你之后自己手动跑）
   - 我把 generate-tts.mjs 写好 + 写 README 指导你怎么跑
   - 我把 audioSrc 路径改为指向最终目标（如 /audio/phrase/{id}.mp3）
   - 但 Phase 3 验收时浏览器仍会看到 audio 404（属预期）
   - 你后续自己跑 TTS 后 404 自然消失，不需要再 commit

   请选一个，并把凭据放 web/.env.local（**绝不**贴 chat 里、绝不 commit 进 git）。
   ```

2. 停手等 Ryan 回复。

**如果 Ryan 选 C 或已经给凭据**：直接接子任务 1。

---

## 子任务 1 · 去日语生造（核心 P0-2）

### 1.1 背景

`web/scripts/convert-content.mjs` 现在的 `buildPhrases / buildShadowing / buildRoleplays`
用模板填空生成日语句子，结果是中日文夹杂的生造句（如
`"本日は、SAP概览与顾问身份建立について確認していきます。"`）。

**N 节硬底线**：禁止编造任何日语句子；找不到真句必须跳过。

### 1.2 真句来源

每课的真实日语句优先级：
1. `../sap_jp_training_course/output/lesson_XX_v4_teacher_focused/01_teacher_core/01_teacher_full_script_slide_by_slide.md`
2. `../sap_jp_training_course/output/lesson_XX_v4_teacher_focused/02_student_materials/01_student_ppt_outline_final.md`
3. `../sap_jp_training_course/output/lesson_XX_v4_teacher_focused/03_classroom_practice/01_classroom_workbook_roleplay.md`
4. `../sap_jp_training_course/output/lesson_XX_v4_teacher_focused/04_case_pack/01_case_pack_appendix_all_modules.md`
5. `../SAP日语培训/output/01_单课课程设计稿/lesson_XX_SAP日语培训课程设计稿.md`
6. `../SAP日语培训/output/02_单课日语课堂逐字稿/lesson_XX_SAP日语课堂逐字稿.md`

### 1.3 真句识别规则

一个**真日语句**必须**全部**满足：

```js
function isRealJapanese(line) {
  const s = line.trim();
  // 至少 8 字
  if (s.length < 8) return false;
  // 不能含中文短语（除 SAP 术语 / 模块名 / 英文缩写）
  // 简化判定：每个汉字必须可能是日语汉字（不在简体中文常用字 vs 日语用法分歧大的字里）
  // 实战做法：用 Unicode 区间 + 排除明显中文虚词
  const chineseOnlyParticles = /[呢吧啊嘛吗哈哟啦哦呀]/;
  if (chineseOnlyParticles.test(s)) return false;
  // 必须含一个日语助词或句末（い/う/だ/た/て/に/が/を/は/も/の/と/で/から/まで/です/ます/でしょう/ください）
  const jpMarker = /(です|ます|ください|でしょう|ましょう|ません|だ。|た。|る。|る$|ない|から|まで|について|として|に対して|に関して|を確認|を教えて|していきます|していただ|させていただ|になります)/;
  if (!jpMarker.test(s)) return false;
  // 必须以句号或问号或感叹号结尾
  if (!/[。？！?!.]$/.test(s)) return false;
  // 不能以列表标记开头
  if (/^[-*•・]/.test(s)) return false;
  return true;
}
```

> **重要**：上述只是 baseline 规则。如果你跑完发现某课抓 0 句，**不要**放宽规则去
> 凑数；正确做法是检查源文件是否真有该课内容，如果源也没有，**该课就跳过**。
>
> 触发"中文短语夹日语助词"的句子（如 `"システム上では项目成员根据角色分工进入议题が行われる"`）**必须丢弃**。
> 判定方法：句子里如果有 **超过 6 字连续的简体中文短语**（不含 SAP 术语 / 英文）就丢弃。

### 1.4 改 `convert-content.mjs`

打开 `web/scripts/convert-content.mjs`，找到 `buildPhrases / buildShadowing / buildRoleplays` 函数。

**完全重写**这 3 个函数：

#### 1.4.1 `extractRealSentences(lessonId, order)`（新增辅助函数）

```js
function extractRealSentences(lessonId, order) {
  const numStr = String(order).padStart(2, "0");
  const sources = [
    path.join(v4Root, `lesson_${numStr}_v4_teacher_focused/01_teacher_core/01_teacher_full_script_slide_by_slide.md`),
    path.join(v4Root, `lesson_${numStr}_v4_teacher_focused/02_student_materials/01_student_ppt_outline_final.md`),
    path.join(v4Root, `lesson_${numStr}_v4_teacher_focused/03_classroom_practice/01_classroom_workbook_roleplay.md`),
    path.join(v4Root, `lesson_${numStr}_v4_teacher_focused/04_case_pack/01_case_pack_appendix_all_modules.md`),
    path.join(sourceRoot, `01_单课课程设计稿/lesson_${numStr}_SAP日语培训课程设计稿.md`),
    path.join(sourceRoot, `02_单课日语课堂逐字稿/lesson_${numStr}_SAP日语课堂逐字稿.md`),
  ];

  const sentences = new Map(); // dedupe by raw text
  for (const src of sources) {
    if (!fs.existsSync(src)) continue;
    const md = fs.readFileSync(src, "utf8");
    // 按行 + 按句号切
    const lines = md.split(/\r?\n/);
    for (const raw of lines) {
      // 去掉 markdown 标记
      const cleaned = raw
        .replace(/^\s*[-*•・]\s*/, "")
        .replace(/^#+\s+/, "")
        .replace(/`/g, "")
        .replace(/^\s*>\s*/, "")
        .replace(/\*\*/g, "")
        .replace(/^[A-Z]+:\s*/, "") // 移除 "A: " "B: " "板書: " 之类前缀
        .replace(/^（[^）]*）/, "")
        .trim();
      // 一行可能有多句，按 。？！ 切
      const parts = cleaned.split(/(?<=[。？！])/);
      for (const p of parts) {
        const candidate = p.trim();
        if (isRealJapanese(candidate) && !sentences.has(candidate)) {
          sentences.set(candidate, { text: candidate, source: src });
        }
      }
    }
  }
  return Array.from(sentences.values());
}
```

#### 1.4.2 `buildPhrases(lessonId, order)` 重写

```js
function buildPhrases(lessonId, order) {
  const real = extractRealSentences(lessonId, order);
  if (real.length === 0) {
    return [];
  }
  return real.slice(0, 24).map((s, i) => {
    const idx = i + 1 + (order - 1) * 30; // 全局 unique id
    return {
      id: `${lessonId}-phrase-${String(idx).padStart(3, "0")}`,
      lessonId,
      category: inferCategory(s.text), // 现有的 categories map
      japanese: s.text,
      chinese: "",                          // 留空，让人工补；不许编中文
      usage: "项目场景",
      replaceableParts: [],
      exampleVariations: [],
      audioSrc: `/audio/phrase/${lessonId}-phrase-${String(idx).padStart(3, "0")}.mp3`,
    };
  });
}
```

中文翻译字段**留空**——以前是把 lesson.title 中文塞进去导致生造。空字符串是诚实的，未来由真人补/Phase 3.5 用 LLM 翻译。

#### 1.4.3 `buildShadowing(lessonId, order, phrases)` 重写

```js
function buildShadowing(lessonId, order, phrases) {
  // shadowing 直接复用 phrases 的真日语句，按 lesson 取前 20 条
  return phrases.slice(0, 20).map((p, i) => ({
    id: `${lessonId}-shadow-${String(i + 1).padStart(2, "0")}`,
    lessonId,
    japanese: p.japanese,
    chinese: p.chinese,  // 也是空字符串
    scenario: p.category,
    audioSrc: `/audio/shadowing/${lessonId}-shadow-${String(i + 1).padStart(2, "0")}.mp3`,
    requiredRepeats: 3,
  }));
}
```

#### 1.4.4 `buildRoleplays(lessonId, order, phrases)` 重写

```js
function buildRoleplays(lessonId, order, phrases) {
  // RolePlay 真句来自 03_classroom_practice/01_classroom_workbook_roleplay.md
  const numStr = String(order).padStart(2, "0");
  const rpSrc = path.join(v4Root, `lesson_${numStr}_v4_teacher_focused/03_classroom_practice/01_classroom_workbook_roleplay.md`);
  if (!fs.existsSync(rpSrc)) return [];
  const md = fs.readFileSync(rpSrc, "utf8");

  // 解析 RolePlay 段：找形如 "A: ..." "B: ..." 的行
  const turns = [];
  const lines = md.split(/\r?\n/);
  for (const raw of lines) {
    const m = raw.match(/^\s*([AB])\s*[:：]\s*(.+)$/);
    if (!m) continue;
    const role = m[1];
    const text = m[2].replace(/\*\*/g, "").trim();
    if (isRealJapanese(text)) {
      turns.push({ role, text });
    }
  }
  if (turns.length < 4) return []; // 至少 4 turn 才算一个 RolePlay

  // 切成 2 个 RolePlay（每个 ~6 turn）
  const out = [];
  for (let rp = 0; rp < 2 && turns.length >= 4; rp += 1) {
    const slice = turns.splice(0, Math.min(8, Math.ceil(turns.length / (2 - rp))));
    if (slice.length < 4) break;
    out.push({
      id: `${lessonId}-roleplay-${rp + 1}`,
      lessonId,
      title: `Role Play ${rp + 1}`,
      scenario: "项目现场",
      roleA: "SAP 顾问",
      roleB: "业务用户 / Key User",
      requiredPhrases: [],   // 留空，不许编
      dialogue: slice,
    });
  }
  return out;
}
```

#### 1.4.5 `buildSubstitutionDrills` 暂时返回空数组

Substitution drill 真句更难抽（要识别"可替换部分"），本 Phase 跳过：

```js
function buildSubstitutionDrills(lessonId, order) {
  return [];  // Phase 3 暂时空；Phase 4 之后再做真句的替换识别
}
```

#### 1.4.6 主流程调用更新

确保 `lesson` 对象生成时：

```js
const phrases = buildPhrases(id, order);
const shadowingItems = buildShadowing(id, order, phrases);
const rolePlays = buildRoleplays(id, order, phrases);
const substitutionDrills = buildSubstitutionDrills(id, order);
// ...
```

#### 1.4.7 在 `data-quality-report.md` 末尾追加内容来源统计

脚本结尾生成 `logs/content-source-report.md`（**别和 data-quality-report.md 同一份**，写新文件）：

```js
function writeContentSourceReport(lessonsWithStats) {
  const lines = [
    "# 内容来源真实性报告",
    "",
    `生成时间：${new Date().toISOString()}`,
    "",
    "本报告记录每课从真实素材抽到的句子数，遵循 N 节真实性硬底线，不编造。",
    "",
    "| Lesson | Phrases | Shadowing | RolePlays | 真句源命中 | 备注 |",
    "|---|---|---|---|---|---|",
  ];
  let totalPhrases = 0;
  let totalShadowing = 0;
  let zeroLessons = [];
  for (const l of lessonsWithStats) {
    lines.push(`| ${l.id} | ${l.phrases} | ${l.shadowing} | ${l.roleplays} | ${l.realCount} | ${l.note ?? ""} |`);
    totalPhrases += l.phrases;
    totalShadowing += l.shadowing;
    if (l.realCount === 0) zeroLessons.push(l.id);
  }
  lines.push("");
  lines.push(`**合计**：phrases ${totalPhrases} / shadowing ${totalShadowing}`);
  if (zeroLessons.length > 0) {
    lines.push("");
    lines.push(`**0 真句课次**（已诚实跳过，不编造）：${zeroLessons.join(", ")}`);
  }
  const reportPath = path.join(logsDir, "content-source-report.md");
  fs.writeFileSync(reportPath, lines.join("\n") + "\n");
  console.log("Wrote", reportPath);
}
```

并在主流程末尾调一次。

### 1.5 跑一次 + 抽检

```bash
cd /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web
npm run convert:content
node -e '
const l=require("./data/lessons.json");
for (const x of [l[0], l[4], l[11], l[19]]) {
  console.log(x.id, "phrases:", x.phrases.length, "shadowing:", x.shadowingItems.length, "roleplays:", x.rolePlays.length);
  console.log("first 5 phrases:");
  x.phrases.slice(0, 5).forEach(p => console.log(" -", p.japanese));
}
'
```

**Codex 你自己抽检 20 句日语**（lesson_01 / 05 / 12 / 20 各 5 句），**0 句含连续 6+ 中文字符的短语**才算合格。
如果抽到 1 句不合规，回头调 `isRealJapanese` 规则再跑。

### 1.6 commit

```bash
cd /Users/openclawxiaoer/sap-hub
git add -A
git commit -m "feat(content): rewrite phrases/shadowing/roleplays to extract real Japanese only

P0-2 fix per logs/claude-code-speaking-platform-review.md.

- New extractRealSentences(): scrapes v4 teacher_focused + 11 大目录 md
- isRealJapanese(): strict regex (≥8 chars, jp markers, end-punct, no chinese-only particles)
- buildPhrases/buildShadowing/buildRoleplays: pull from real sentences only, drop fabricated template fillers
- Chinese translation fields left empty (honest) instead of fabricated; will be backfilled by human/LLM in Phase 3.5
- buildSubstitutionDrills returns [] temporarily (Phase 4 will revisit)
- New logs/content-source-report.md tracks per-lesson real sentence counts

Honors AGENTS.md hard rule: 日语表达要符合真实日本 SAP 项目职场用法，不生造"
```

---

## 子任务 2 · 跑 convert + 检查 content-source-report.md

```bash
cd /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web
npm run convert:content
cat /Users/openclawxiaoer/sap-hub/logs/content-source-report.md
```

**期望**：
- 24 课每课至少有 1 个 phrase（如果某课 0，那就是源真没有真日语句，是真实情况，不报错）
- 报告里"0 真句课次"列表应该为空或很少（理想 0，可接受 ≤ 2 课）
- 总 phrases 数应该比 Phase 1 时（576）少——这是预期的，因为去掉了生造的

如果出现 ≥ 5 课 0 真句：停手在 inbox 写 ask，让 Ryan 决定是放宽 isRealJapanese 规则还是接受少数据。

不需要单独 commit（report 在 logs/，跟主仓库共用 git）。

---

## 子任务 3 · 写 + 跑 `scripts/generate-tts.mjs`

### 3.1 写脚本

文件：`web/scripts/generate-tts.mjs`

```js
#!/usr/bin/env node
// scripts/generate-tts.mjs - 批量 TTS 生成
// 使用：node scripts/generate-tts.mjs
// 凭据：web/.env.local 里配 AZURE_SPEECH_KEY / AZURE_SPEECH_REGION
//      （备选 OPENAI_API_KEY，未实现）

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

// 读 .env.local（简易解析，避免引入 dotenv）
function loadEnv() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnv();

const PROVIDER = process.env.TTS_PROVIDER ?? "azure"; // azure | openai
const AZURE_KEY = process.env.AZURE_SPEECH_KEY;
const AZURE_REGION = process.env.AZURE_SPEECH_REGION ?? "japaneast";
const AZURE_VOICE = process.env.AZURE_TTS_VOICE ?? "ja-JP-NanamiNeural";

if (PROVIDER === "azure" && !AZURE_KEY) {
  console.error("ERROR: AZURE_SPEECH_KEY missing in web/.env.local");
  console.error("Refer to projects/4-sap-training/inbox/need-input-phase3-tts-*.md");
  console.error("Or set TTS_PROVIDER=skip to no-op.");
  if (process.env.TTS_PROVIDER !== "skip") process.exit(1);
}

const SKIP = process.env.TTS_PROVIDER === "skip";

const lessons = JSON.parse(fs.readFileSync(path.join(root, "data/lessons.json"), "utf8"));
const phrases = JSON.parse(fs.readFileSync(path.join(root, "data/phrases.json"), "utf8"));

const audioRoot = path.join(root, "public/audio");
fs.mkdirSync(path.join(audioRoot, "phrase"), { recursive: true });
fs.mkdirSync(path.join(audioRoot, "shadowing"), { recursive: true });
fs.mkdirSync(path.join(audioRoot, "term"), { recursive: true });

const failures = [];
let okCount = 0;
let skipCount = 0;

async function azureSynthesize(text, outPath) {
  // 1. 拿 token
  const tokenRes = await fetch(
    `https://${AZURE_REGION}.api.cognitive.microsoft.com/sts/v1.0/issuetoken`,
    { method: "POST", headers: { "Ocp-Apim-Subscription-Key": AZURE_KEY } }
  );
  if (!tokenRes.ok) throw new Error(`token ${tokenRes.status}`);
  const token = await tokenRes.text();

  // 2. SSML 合成
  const ssml = `<speak version='1.0' xml:lang='ja-JP'><voice name='${AZURE_VOICE}'>${escapeXml(text)}</voice></speak>`;
  const ttsRes = await fetch(
    `https://${AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
        "User-Agent": "sap-jp-tts",
      },
      body: ssml,
    }
  );
  if (!ttsRes.ok) throw new Error(`tts ${ttsRes.status}: ${await ttsRes.text()}`);
  const buf = Buffer.from(await ttsRes.arrayBuffer());
  fs.writeFileSync(outPath, buf);
}

function escapeXml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function maybeSynthesize(text, outPath, label) {
  if (!text || !text.trim()) return;
  if (fs.existsSync(outPath)) {
    skipCount += 1;
    return;
  }
  if (SKIP) {
    skipCount += 1;
    return;
  }
  try {
    await azureSynthesize(text, outPath);
    okCount += 1;
    process.stdout.write(".");
  } catch (e) {
    failures.push({ label, text, error: String(e) });
    process.stdout.write("x");
  }
}

(async () => {
  console.log(`TTS provider=${PROVIDER}${SKIP ? " (skip mode)" : ""}, voice=${AZURE_VOICE}`);
  console.log(`Target dir: ${audioRoot}`);

  // 1. phrases
  for (const p of phrases) {
    if (!p.japanese) continue;
    const out = path.join(audioRoot, "phrase", `${p.id}.mp3`);
    await maybeSynthesize(p.japanese, out, p.id);
  }
  console.log();
  console.log(`Phrases: ok=${okCount} skip=${skipCount} fail=${failures.length}`);

  // 2. shadowing
  okCount = 0;
  skipCount = 0;
  for (const lesson of lessons) {
    for (const s of lesson.shadowingItems ?? []) {
      if (!s.japanese) continue;
      const out = path.join(audioRoot, "shadowing", `${s.id}.mp3`);
      await maybeSynthesize(s.japanese, out, s.id);
    }
  }
  console.log();
  console.log(`Shadowing: ok=${okCount} skip=${skipCount} fail=${failures.length}`);

  // 3. terms（暂时 term audio 可选；如果 glossary.json 里 japanese 字段有，就生成）
  okCount = 0;
  skipCount = 0;
  const glossary = JSON.parse(fs.readFileSync(path.join(root, "data/glossary.json"), "utf8"));
  for (const t of glossary) {
    if (!t.japanese) continue;
    const out = path.join(audioRoot, "term", `${t.id}.mp3`);
    await maybeSynthesize(t.japanese, out, t.id);
  }
  console.log();
  console.log(`Terms: ok=${okCount} skip=${skipCount} fail=${failures.length}`);

  if (failures.length > 0) {
    const reportPath = path.resolve(root, "../../../logs/tts-failures.md");
    fs.writeFileSync(
      reportPath,
      "# TTS 失败记录\n\n" +
        failures.map((f) => `- ${f.label}: ${f.error}\n  \`${f.text}\``).join("\n") +
        "\n"
    );
    console.log(`Failures recorded at ${reportPath}`);
  }
  console.log("Done.");
})().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
```

### 3.2 改 `package.json` scripts

加一行：

```json
"tts": "node scripts/generate-tts.mjs"
```

### 3.3 改 `.gitignore`

> sap-hub 根目录已经有规则 `**/*.mp3`，所以 public/audio/ 下的 mp3 都不会被 add。
> 但需要确认 audio 子目录本身能 commit（用 .gitkeep）。

在 `web/public/audio/` 下创建：
- `web/public/audio/phrase/.gitkeep`
- `web/public/audio/shadowing/.gitkeep`
- `web/public/audio/term/.gitkeep`

让目录存在但内容 mp3 不入库。

### 3.4 跑 TTS（如果 Ryan 给了凭据）

```bash
cd /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web
# 确认 .env.local 存在且不在 git tracked 里：
cat .env.local | head   # 看看凭据在
git ls-files .env.local   # 应该输出空
# 跑：
npm run tts
```

预计 5-20 分钟（Azure F0 每秒 10 字符限制，需要做节流；如果脚本卡顿，加 `await new Promise(r => setTimeout(r, 50))` 在每次合成后）。

跑完检查：

```bash
ls public/audio/phrase | wc -l       # 应该 ~200+
ls public/audio/shadowing | wc -l    # 应该 ~400+
ls public/audio/term | wc -l         # 应该 ~500+（glossary 528 条）
```

> **如果 Ryan 没给凭据（子任务 0 选 C）**：把 `npm run tts` 这条命令**不要跑**。
> 脚本写好 + commit 即可。Ryan 后续自己跑。
> 你只确认 `node scripts/generate-tts.mjs` **能在没有 KEY 时优雅退出**（脚本顶部
> 的 `if (PROVIDER === "azure" && !AZURE_KEY) process.exit(1)` 这段）——别让没凭据的执行炸掉。

### 3.5 commit

```bash
cd /Users/openclawxiaoer/sap-hub
git add -A
git commit -m "feat(audio): add scripts/generate-tts.mjs for batch Azure Speech TTS

P0-1 fix. Generates mp3 for phrases/shadowing/terms from data/*.json.
Azure ja-JP-NanamiNeural by default; reads creds from web/.env.local.
Audio output to web/public/audio/{phrase,shadowing,term}/, .gitignore excludes mp3.
Incremental: skips existing mp3 files.
TTS_PROVIDER=skip mode for no-op (used when ryan defers TTS generation)."
```

---

## 子任务 4 · 更新 audioSrc 路径 + 重跑 convert

`convert-content.mjs` 里现有的 `placeholderAudio()` 函数已经在子任务 1 重写时改成了
`/audio/phrase/{id}.mp3` 等。Sanity check：

```bash
cd /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web
npm run convert:content
node -e '
const l = require("./data/lessons.json");
console.log("first phrase audioSrc:", l[0].phrases[0]?.audioSrc);
console.log("first shadow audioSrc:", l[0].shadowingItems[0]?.audioSrc);
'
```

期望：
- `/audio/phrase/lesson_01-phrase-001.mp3`
- `/audio/shadowing/lesson_01-shadow-01.mp3`

如果还是 `/audio/placeholders/...` → 你子任务 1 写得有问题，回头修。

### 跑 dev 看效果（如果 TTS 已经跑过）

```bash
npm run dev -- --hostname 127.0.0.1 --port 3000
# 浏览器开 /courses/lessons/lesson_01 点 Shadowing 卡的播放按钮
# 看 dev-server.log 是不是 200 而不是 404
```

无 commit（已经在子任务 1 的 commit 里改了）。

---

## 子任务 5 · Dashboard 修复 + 进度条真起来

### 5.1 `app/dashboard/page.tsx`

P1-1 修复：`todayLesson` 在初次 render 时永远是 `allLessons[0]`，需要包 `useMemo([progress])`。

打开 `web/app/dashboard/page.tsx`：

```tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { allLessons } from "@/lib/content-loader";
import { estimatedLessonMinutes, oralTaskCount } from "@/lib/lesson-utils";
import { loadProgress } from "@/lib/progress-storage";
import type { ProgressState } from "@/types/progress";

export default function DashboardPage() {
  const [progress, setProgress] = useState<ProgressState | null>(null);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  // 包 useMemo，依赖 progress；progress 未加载时返回 null 显示 loading
  const todayLesson = useMemo(() => {
    if (!progress) return null;
    return (
      allLessons.find((lesson) => !progress.completedLessons.includes(lesson.id)) ??
      allLessons[allLessons.length - 1]
    );
  }, [progress]);

  if (!progress || !todayLesson) {
    return (
      <div className="page-shell">
        <div className="panel p-6">
          <p className="text-sm text-slate-500">加载学习进度中…</p>
        </div>
      </div>
    );
  }

  // ... 其余 render 不变
}
```

### 5.2 `components/lesson/LessonHeader.tsx`

P1-3 修复：`ProgressBar value={0}` 写死。改成动态计算。

把 LessonHeader 改成 client component（加 `"use client"`），用 useEffect 读 progress：

```tsx
"use client";

import { useEffect, useState } from "react";
import type { Lesson } from "@/types/lesson";
import { estimatedLessonMinutes, lessonNumberLabel, oralTaskCount } from "@/lib/lesson-utils";
import { loadProgress } from "@/lib/progress-storage";
import { ProgressBar } from "@/components/layout/ProgressBar";

export function LessonHeader({ lesson }: { lesson: Lesson }) {
  const [progressPct, setProgressPct] = useState(0);

  useEffect(() => {
    const progress = loadProgress();
    const total =
      lesson.shadowingItems.length +
      lesson.microTrainings.length +
      lesson.consultantOutputs.length +
      lesson.rolePlays.length;
    if (total === 0) return;
    const done =
      progress.completedShadowing.filter((id) => id.startsWith(lesson.id)).length +
      progress.completedRecordings.filter((id) => id.startsWith(lesson.id)).length;
    setProgressPct(Math.min(100, Math.round((done / total) * 100)));
  }, [lesson]);

  return (
    <div className="panel space-y-4 p-5">
      {/* 原有结构 */}
      <div>
        <p className="text-sm font-semibold text-sap">{lessonNumberLabel(lesson)}</p>
        <h1 className="mt-1 text-2xl font-bold text-ink">{lesson.title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">{lesson.summary}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="今日预计学习时间" value={`${estimatedLessonMinutes(lesson)} 分钟`} />
        <Metric label="口语任务数量" value={`${oralTaskCount(lesson)} 个`} />
        <Metric
          label="录音作业"
          value={`${lesson.assignments.filter((item) => item.type === "recording" || item.type === "consultant-output").length} 个`}
        />
        <div className="rounded-lg border border-line bg-mist p-3">
          <ProgressBar value={progressPct} label="本地完成进度" />
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-mist p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-ink">{value}</p>
    </div>
  );
}
```

### 5.3 commit

```bash
cd /Users/openclawxiaoer/sap-hub
git add -A
git commit -m "fix(ui): dashboard today-lesson memoization + lesson progress bar live calc

P1-1 + P1-3 fixes per logs/claude-code-speaking-platform-review.md.

- Dashboard.todayLesson now useMemo([progress]); shows loading skeleton until progress loads
- LessonHeader becomes client component; ProgressBar value derived from progress.completed{Shadowing,Recordings} filtered by lessonId prefix"
```

---

## 子任务 6 · 波形真起来 + blob URL 修复

### 6.1 `components/audio/RecordingPanel.tsx`

P1-5 + P1-6 修复。改动两处：

#### A. 让 WaveformVisualizer 接到真实音频流

加一个 `analyserRef`，在 `startRecording` 时把 stream 接 AudioContext → AnalyserNode：

```tsx
const audioContextRef = useRef<AudioContext | null>(null);
const analyserRef = useRef<AnalyserNode | null>(null);

async function startRecording() {
  const stream = await requestPermission();
  if (!stream) return;
  chunksRef.current = [];
  setDurationSec(0);
  setAudioUrl("");
  setBlob(null);

  // 新增：接 AudioContext 拿真实波形
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);
    audioContextRef.current = audioCtx;
    analyserRef.current = analyser;
  } catch (e) {
    // 不影响录音本身；只是波形显示降级
    console.warn("AnalyserNode setup failed:", e);
  }

  try {
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop());
      // 清理 audioContext
      if (audioContextRef.current) {
        try { await audioContextRef.current.close(); } catch {}
        audioContextRef.current = null;
        analyserRef.current = null;
      }
      // ... 原有 onstop 逻辑
    };
    // ...
  }
}
```

把 `analyserRef.current` 传给 `<WaveformVisualizer analyser={analyserRef.current} active={status === "recording"} />`。

#### B. `audioUrl` 字段不写 blob URL

找到 `saveCurrentRecording`：

```ts
const recording: RecordingAttempt = {
  id: `${lessonId}-${practiceType}-${Date.now()}`,
  userId: "local-student",
  lessonId,
  practiceType,
  promptText,
  targetJapanese,
  audioUrl: "",                     // 不再写 URL.createObjectURL，留空字符串
  blob: activeBlob,                 // blob 单独存
  durationSec,
  createdAt: new Date().toISOString(),
  selfAssessment: fallbackAssessment,
};
```

### 6.2 `components/audio/WaveformVisualizer.tsx`

改为接 AnalyserNode 真实音量：

```tsx
"use client";

import { useEffect, useRef } from "react";

export function WaveformVisualizer({
  active,
  analyser,
}: {
  active: boolean;
  analyser?: AnalyserNode | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const bars = 64;
    const dataArray = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#edf3f7";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (active && analyser && dataArray) {
        analyser.getByteTimeDomainData(dataArray);
        const barWidth = canvas.width / bars;
        for (let i = 0; i < bars; i += 1) {
          const idx = Math.floor((i / bars) * dataArray.length);
          const v = dataArray[idx] / 128.0 - 1.0;
          const h = Math.abs(v) * canvas.height * 0.9 + 4;
          ctx.fillStyle = "#0f6fbd";
          ctx.fillRect(i * barWidth + 2, canvas.height / 2 - h / 2, barWidth - 4, h);
        }
      } else {
        // idle / no analyser：画静态低幅波形
        const barWidth = canvas.width / bars;
        for (let i = 0; i < bars; i += 1) {
          const h = 6;
          ctx.fillStyle = "#9aa8b5";
          ctx.fillRect(i * barWidth + 2, canvas.height / 2 - h / 2, barWidth - 4, h);
        }
      }
      raf = window.requestAnimationFrame(draw);
    };
    draw();
    return () => window.cancelAnimationFrame(raf);
  }, [active, analyser]);

  return <canvas ref={canvasRef} className="h-20 w-full rounded-md border border-line" width={720} height={96} />;
}
```

### 6.3 `lib/audio-storage.ts:recordingToObjectUrl`

调整：

```ts
export function recordingToObjectUrl(recording: RecordingAttempt) {
  if (recording.blob) return URL.createObjectURL(recording.blob);
  return recording.audioUrl ?? "";
}
```

**调用方负责 `URL.revokeObjectURL(url)`**（`RecordingHistory.tsx` 等用了 `recordingToObjectUrl` 的地方加 useEffect 清理）。

### 6.4 commit

```bash
git add -A
git commit -m "fix(audio): real waveform via AnalyserNode + stop persisting blob URL

P1-5 + P1-6 fixes per logs/claude-code-speaking-platform-review.md.

- RecordingPanel creates AudioContext + AnalyserNode on startRecording;
  passes analyser ref to WaveformVisualizer
- WaveformVisualizer.getByteTimeDomainData() draws real audio amplitude;
  fallback static bars when idle/no analyser
- RecordingAttempt.audioUrl no longer stored as URL.createObjectURL output
  (blob URLs invalidate on page refresh); blob field is source of truth
- recordingToObjectUrl regenerates URL each call from blob"
```

---

## 子任务 7 · 自评闭环 + 收藏 key 统一

### 7.1 `lib/progress-storage.ts`

P2-1 + P2-2 修复。

```ts
"use client";

import type { ProgressState } from "@/types/progress";
import type { SelfAssessment } from "@/types/audio";

const KEY = "sap-jp-speaking-progress-v1";

export const defaultProgress: ProgressState = {
  completedLessons: [],
  completedTerms: [],
  completedPhrases: [],
  completedShadowing: [],
  completedRecordings: [],
  completedAssignments: [],
  favoriteTerms: [],
  favoritePhrases: [],
  favoriteShadowing: [],         // 新增：shadowingItem id
  selfAssessments: {},
};

export function loadProgress(): ProgressState {
  if (typeof window === "undefined") return defaultProgress;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultProgress;
    const parsed = JSON.parse(raw);
    // 迁移老数据：把 favoriteSentences 合并到 favoriteShadowing
    if (Array.isArray(parsed.favoriteSentences)) {
      parsed.favoriteShadowing = [...new Set([...(parsed.favoriteShadowing ?? []), ...parsed.favoriteSentences])];
      delete parsed.favoriteSentences;
    }
    return { ...defaultProgress, ...parsed };
  } catch {
    return defaultProgress;
  }
}

export function saveProgress(progress: ProgressState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify({ ...progress, recentStudyAt: new Date().toISOString() }));
}

export function toggleProgressList<K extends keyof ProgressState>(key: K, id: string) {
  const progress = loadProgress();
  const current = progress[key];
  if (!Array.isArray(current)) return progress;
  const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
  const updated = { ...progress, [key]: next, recentStudyAt: new Date().toISOString() } as ProgressState;
  saveProgress(updated);
  return updated;
}

export function markProgress<K extends keyof ProgressState>(key: K, id: string) {
  const progress = loadProgress();
  const current = progress[key];
  if (!Array.isArray(current)) return progress;
  if (current.includes(id)) return progress;
  const updated = { ...progress, [key]: [...current, id], recentStudyAt: new Date().toISOString() } as ProgressState;
  saveProgress(updated);
  return updated;
}

// 新增：自评闭环
export function setSelfAssessment(recordingId: string, score: SelfAssessment) {
  const progress = loadProgress();
  const next = {
    ...progress,
    selfAssessments: { ...progress.selfAssessments, [recordingId]: score },
    recentStudyAt: new Date().toISOString(),
  };
  saveProgress(next);
  return next;
}
```

### 7.2 `types/progress.ts`

加 `favoriteShadowing` 字段（顺便确认其它字段都在）：

```ts
import type { SelfAssessment } from "./audio";

export type ProgressState = {
  completedLessons: string[];
  completedTerms: string[];
  completedPhrases: string[];
  completedShadowing: string[];
  completedRecordings: string[];
  completedAssignments: string[];
  favoriteTerms: string[];
  favoritePhrases: string[];
  favoriteShadowing: string[];           // 新增
  selfAssessments: Record<string, SelfAssessment>;
  recentStudyAt?: string;
};
```

砍掉 `favoriteSentences` 字段（在 loadProgress 里做了迁移）。

### 7.3 `components/speaking/SelfAssessmentForm.tsx`

接 `recordingId` prop，onChange 时调 setSelfAssessment：

```tsx
"use client";

import { useEffect, useState } from "react";
import type { SelfAssessment } from "@/types/audio";
import { setSelfAssessment } from "@/lib/progress-storage";

const fields: Array<[keyof SelfAssessment, string]> = [
  ["pronunciation", "发音清晰度"],
  ["fluency", "流利度"],
  ["naturalness", "自然度"],
  ["sapAccuracy", "SAP 术语准确度"],
  ["consultantLike", "顾问表达感"],
];

const defaultValue: SelfAssessment = {
  pronunciation: 3,
  fluency: 3,
  naturalness: 3,
  sapAccuracy: 3,
  consultantLike: 3,
  memo: "",
};

export function SelfAssessmentForm({
  value,
  recordingId,
  onChange,
}: {
  value?: SelfAssessment;
  recordingId?: string;
  onChange?: (value: SelfAssessment) => void;
}) {
  const [form, setForm] = useState<SelfAssessment>(value ?? defaultValue);

  function update(next: SelfAssessment) {
    setForm(next);
    if (recordingId) setSelfAssessment(recordingId, next);
    onChange?.(next);
  }

  return (
    <div className="space-y-3 rounded-lg border border-line bg-mist p-3">
      {fields.map(([key, label]) => (
        <label key={key} className="grid gap-2 text-sm sm:grid-cols-[160px_1fr_32px] sm:items-center">
          <span className="font-medium text-ink">{label}</span>
          <input
            type="range"
            min={1}
            max={5}
            value={Number(form[key])}
            className="accent-sap"
            onChange={(event) => update({ ...form, [key]: Number(event.target.value) })}
          />
          <span className="text-right font-semibold text-sap">{Number(form[key])}</span>
        </label>
      ))}
      <textarea
        className="input min-h-20 w-full"
        value={form.memo}
        onChange={(event) => update({ ...form, memo: event.target.value })}
        placeholder="学生备注：哪里卡住、哪些词想让讲师看"
      />
      {!recordingId ? (
        <p className="text-xs text-slate-500">提示：先保存录音后，自评分数会自动入库。</p>
      ) : null}
    </div>
  );
}
```

### 7.4 `components/speaking/ShadowingCard.tsx`

把 `toggleProgressList("favoriteSentences", item.id)` 改为
`toggleProgressList("favoriteShadowing", item.id)`。

把 `<RecordingPanel>` 通过 `onSaved={(rec) => /* 状态：当前 recordingId */}` 拿到 id，
然后传给 `<SelfAssessmentForm recordingId={lastRecordingId} />`：

```tsx
const [lastRecordingId, setLastRecordingId] = useState<string | undefined>();

// ...

<RecordingPanel
  lessonId={item.lessonId}
  practiceType="shadowing"
  promptText={`跟读：${item.chinese || item.japanese}`}
  targetJapanese={item.japanese}
  onSaved={(rec) => setLastRecordingId(rec.id)}
/>
<SelfAssessmentForm recordingId={lastRecordingId} />
```

同样改 `MicroTrainingTimer.tsx / ConsultantOutputRecorder.tsx / RolePlayRecorder.tsx`
都加 `lastRecordingId` 状态，传给 SelfAssessmentForm。

### 7.5 `app/review/page.tsx`

把 `favoritePhrases` 之外，加上 `favoriteShadowing` 渲染。把"低分自评项目"逻辑保持不变
（数据已经会通过 setSelfAssessment 进来）。

### 7.6 commit

```bash
git add -A
git commit -m "fix(progress): self-assessment closed loop + favorite key unification

P2-1 + P2-2 fixes per logs/claude-code-speaking-platform-review.md.

- progress-storage: new setSelfAssessment(recordingId, score) persists to localStorage
- progress-storage: drop favoriteSentences, add favoriteShadowing; loadProgress() migrates old data
- types/progress.ts: schema updated
- SelfAssessmentForm: accepts recordingId prop; auto-persists score on change
- ShadowingCard/MicroTrainingTimer/ConsultantOutputRecorder/RolePlayRecorder: thread lastRecordingId from RecordingPanel.onSaved into SelfAssessmentForm
- Review page now reads from both favoritePhrases and favoriteShadowing"
```

---

## 子任务 8 · 讲师占位（StudentRecordingReview 警告卡）

P0-3 修复。

打开 `web/components/teacher/StudentRecordingReview.tsx`，**完全替换**为警告卡：

```tsx
export function StudentRecordingReview() {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
      <p className="text-sm font-semibold text-amber-900">学生录音查看 · 当前不可用</p>
      <p className="mt-2 text-sm text-amber-800 leading-relaxed">
        本功能需要后端支持（Phase 5/6 上线后真正可用）。当前版本学生录音仅存储在
        学生自己的浏览器 IndexedDB，讲师无法跨设备查看。
      </p>
      <p className="mt-2 text-sm text-amber-800 leading-relaxed">
        如需点评，请暂时让学生通过其他渠道（邮件 / 网盘）直接发录音文件。
      </p>
      <p className="mt-3 text-xs text-amber-700">
        预计上线：v1.0 ·
        详见 <code className="rounded bg-white px-1">logs/codex-evolution-roadmap.md</code> Phase 5/6
      </p>
    </div>
  );
}
```

### commit

```bash
git add -A
git commit -m "fix(teacher): replace misleading recording review with explicit placeholder

P0-3 fix per logs/claude-code-speaking-platform-review.md.

Previously StudentRecordingReview.tsx rendered <RecordingHistory /> which reads
the *teacher's own browser* IndexedDB. This silently misled teachers into thinking
they were seeing student recordings. Replace with an explicit amber warning card
that states the feature requires backend (Phase 5/6)."
```

---

## 子任务 9 · 文本作业不丢

P0-6 修复。

### 9.1 `app/assignments/page.tsx`

textarea 改受控 + localStorage 持久化：

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Mic2 } from "lucide-react";
import { allAssignments, allLessons } from "@/lib/content-loader";
import { RecordingPanel } from "@/components/audio/RecordingPanel";

const typeLabels = {
  vocabulary: "词汇作业",
  phrase: "句型作业",
  recording: "录音作业",
  "consultant-output": "项目化输出作业",
  text: "文本作业",
} as const;

const STORAGE_PREFIX = "sap-jp-assignment-text-";

function loadText(assignmentId: string) {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(STORAGE_PREFIX + assignmentId) ?? "";
  } catch {
    return "";
  }
}

function saveText(assignmentId: string, value: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_PREFIX + assignmentId, value);
}

function TextAssignmentInput({ assignmentId, prompt }: { assignmentId: string; prompt: string }) {
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(true);

  useEffect(() => {
    setText(loadText(assignmentId));
  }, [assignmentId]);

  function onChange(v: string) {
    setText(v);
    setSaved(false);
  }

  function onSave() {
    saveText(assignmentId, text);
    setSaved(true);
  }

  return (
    <div className="mt-3 space-y-2">
      <textarea
        className="input min-h-24 w-full"
        placeholder={prompt}
        value={text}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-slate-500">
          {saved ? "已本地保存" : "未保存（点击保存按钮）"}
        </span>
        <button type="button" className="btn-secondary" onClick={onSave}>
          保存到本地
        </button>
      </div>
    </div>
  );
}

export default function AssignmentsPage() {
  const [lessonId, setLessonId] = useState("");
  const assignments = useMemo(
    () => allAssignments.filter((item) => !lessonId || item.lessonId === lessonId),
    [lessonId]
  );
  const recordingAssignments = assignments.filter(
    (item) => item.type === "recording" || item.type === "consultant-output"
  );
  const textAssignments = assignments.filter(
    (item) => item.type !== "recording" && item.type !== "consultant-output"
  );

  return (
    <div className="page-shell space-y-6">
      {/* 头部 + select 不变 */}
      <div>
        <p className="text-sm font-semibold text-sap">Assignments</p>
        <h1 className="text-2xl font-bold text-ink">作业中心</h1>
      </div>
      <select
        className="input w-full"
        value={lessonId}
        onChange={(event) => setLessonId(event.target.value)}
      >
        <option value="">全部课程</option>
        {allLessons.map((lesson) => (
          <option key={lesson.id} value={lesson.id}>
            第 {String(lesson.order).padStart(2, "0")} 课 · {lesson.title}
          </option>
        ))}
      </select>

      {/* 录音作业部分原样 */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
          <Mic2 className="h-5 w-5 text-sap" />
          录音作业
        </h2>
        {recordingAssignments.slice(0, 12).map((assignment) => (
          <div key={assignment.id} className="panel p-4">
            <p className="font-semibold text-ink">{assignment.title}</p>
            <p className="mt-1 text-sm text-slate-600">{assignment.prompt}</p>
            <RecordingPanel
              lessonId={assignment.lessonId}
              practiceType={
                assignment.type === "consultant-output" ? "consultant-output" : "shadowing"
              }
              promptText={assignment.prompt}
              markAsAssignment
            />
          </div>
        ))}
      </section>

      {/* 文本作业改为受控 */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">文本与句型作业</h2>
        <div className="grid gap-3 lg:grid-cols-2">
          {textAssignments.slice(0, 24).map((assignment) => (
            <div key={assignment.id} className="panel p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-ink">{assignment.title}</p>
                <span className="rounded-md bg-mist px-2 py-1 text-xs text-slate-600">
                  {typeLabels[assignment.type]}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{assignment.prompt}</p>
              <TextAssignmentInput assignmentId={assignment.id} prompt={assignment.prompt} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
```

### 9.2 `components/lesson/LessonAssignment.tsx`

同样改：

```tsx
"use client";

import { useEffect, useState } from "react";
import type { Assignment } from "@/types/assignment";
import { RecordingPanel } from "@/components/audio/RecordingPanel";

const STORAGE_PREFIX = "sap-jp-assignment-text-";

function loadText(id: string) {
  if (typeof window === "undefined") return "";
  try { return window.localStorage.getItem(STORAGE_PREFIX + id) ?? ""; } catch { return ""; }
}
function saveText(id: string, v: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_PREFIX + id, v);
}

function TextInput({ id, prompt }: { id: string; prompt: string }) {
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(true);
  useEffect(() => setText(loadText(id)), [id]);
  return (
    <div className="mt-3 space-y-2">
      <textarea
        className="input min-h-24 w-full"
        placeholder={prompt}
        value={text}
        onChange={(e) => { setText(e.target.value); setSaved(false); }}
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-slate-500">{saved ? "已本地保存" : "未保存"}</span>
        <button type="button" className="btn-secondary" onClick={() => { saveText(id, text); setSaved(true); }}>
          保存到本地
        </button>
      </div>
    </div>
  );
}

export function LessonAssignment({ assignments }: { assignments: Assignment[] }) {
  return (
    <section className="panel p-4">
      <h2 className="text-lg font-semibold text-ink">作业</h2>
      <div className="mt-3 space-y-3">
        {assignments.map((assignment) => (
          <div key={assignment.id} className="rounded-lg border border-line bg-white p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-ink">{assignment.title}</p>
                <p className="mt-1 text-sm text-slate-600">{assignment.prompt}</p>
              </div>
              <span className="rounded-md bg-mist px-2 py-1 text-xs text-slate-600">
                {assignment.type}
              </span>
            </div>
            {assignment.type === "recording" || assignment.type === "consultant-output" ? (
              <div className="mt-3">
                <RecordingPanel
                  lessonId={assignment.lessonId}
                  practiceType={assignment.type === "consultant-output" ? "consultant-output" : "shadowing"}
                  promptText={assignment.prompt}
                  markAsAssignment
                />
              </div>
            ) : (
              <TextInput id={assignment.id} prompt={assignment.prompt} />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
```

### 9.3 commit

```bash
git add -A
git commit -m "fix(assignments): persist text assignments to localStorage

P0-6 fix per logs/claude-code-speaking-platform-review.md.

Previously app/assignments/page.tsx and components/lesson/LessonAssignment.tsx
rendered uncontrolled <textarea>: typed text lost on refresh. Now both pages
use TextInput component with localStorage persistence (key prefix
sap-jp-assignment-text-) + explicit save button + state indicator."
```

---

## 子任务 10 · `data/_meta.json` + 终检 + handoff

### 10.1 `data/_meta.json`

文件路径：`web/data/_meta.json`

```js
function buildMeta(stats) {
  const meta = {
    schemaVersion: "1.1.0",
    generatedAt: new Date().toISOString(),
    sourceCommit: <try git rev-parse HEAD>,
    stats: {
      tracks: stats.tracks,
      lessons: stats.lessons,
      phrases: stats.phrases,
      shadowing: stats.shadowing,
      roleplays: stats.roleplays,
      glossaryTerms: stats.glossaryTerms,
      libraryItems: stats.libraryItems,
      totalAssets: stats.totalAssets,
    },
    audio: {
      provider: process.env.TTS_PROVIDER ?? "azure",
      voice: process.env.AZURE_TTS_VOICE ?? "ja-JP-NanamiNeural",
      generated: false, // 由 generate-tts.mjs 跑完后写 true（手动 / 后处理）
    },
    notes: [
      "Chinese translation fields for phrases/shadowing are intentionally empty",
      "(see Phase 3 子任务 1) - never fabricate.",
      "Audio mp3 files are .gitignore'd; run `npm run tts` after providing creds.",
    ],
  };
  writeJson("_meta.json", meta);
}
```

在 `convert-content.mjs` 主流程末尾调一次 `buildMeta(stats)`，stats 从前面几个 build
函数返回的数量累加。

### 10.2 终检

```bash
cd /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web
npm run convert:content     # 生成 _meta.json
npm run typecheck            # 必须通过
npm run build                # 必须通过

# dev 起来抽测
npm run dev -- --hostname 127.0.0.1 --port 3000 &
DEV_PID=$!
sleep 5
# 浏览器手测：
#   /dashboard         → 完成 lesson_01 后推荐 lesson_02（暂时无法测，但 useMemo 逻辑要看到）
#   /courses/lessons/lesson_01 → ProgressBar 起码不写死 0，shadowing 录音保存后能涨
#   /speaking/recording → 录音时贴近/远离麦克风，波形真起来（不再是 sin 假动画）
#   /assignments       → 输入文本刷新还在
#   /teacher           → StudentRecordingReview 显示黄色警告卡而不是空列表
#   /review            → 录完 1 条录音 + 拉自评低分，复盘中心能显示
kill $DEV_PID
```

每一项不通过就回到对应子任务修。

### 10.3 cat 报告

```bash
cat /Users/openclawxiaoer/sap-hub/logs/content-source-report.md
cat /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web/data/_meta.json
```

把这两份内容贴到 handoff 里。

### 10.4 commit

```bash
git add -A
git commit -m "chore(state): record Phase 3 MVP rescue completion + data meta"
```

### 10.5 写交接

`projects/4-sap-training/inbox/handoff-phase-3-{今日 YYYYMMDD}.md`：

```markdown
# Phase 3 Handoff · {YYYY-MM-DD}

## Scope
执行 Phase 3「本地训练 MVP 救活」。修评审报告 P0/P1/P2 共 11 项。

## 起始状态
- 起始 commit: <main 当前 HEAD>
- 工作分支: codex/phase-3-mvp-rescue
- Phase 3 commits（约 8-10 个）:
  - <hash1> feat(content): rewrite phrases/shadowing/roleplays to extract real Japanese only
  - <hash2> feat(audio): add scripts/generate-tts.mjs for batch Azure Speech TTS
  - <hash3> fix(ui): dashboard today-lesson memoization + lesson progress bar live calc
  - <hash4> fix(audio): real waveform via AnalyserNode + stop persisting blob URL
  - <hash5> fix(progress): self-assessment closed loop + favorite key unification
  - <hash6> fix(teacher): replace misleading recording review with explicit placeholder
  - <hash7> fix(assignments): persist text assignments to localStorage
  - <hash8> chore(state): record Phase 3 MVP rescue completion + data meta

## Verification 数据

| 修复项 | 状态 |
|---|---|
| P0-1 真音频 TTS 脚本 | ✅ 脚本写好 / 跑了 <几> mp3 / 跑了 0 mp3 等 Ryan 跑 |
| P0-2 去日语生造 | ✅ 24 课 phrases 总数 X（旧 576） / 0 真句课次 N 个 |
| P0-3 讲师占位 | ✅ StudentRecordingReview 黄色警告卡 |
| P0-6 文本作业不丢 | ✅ localStorage key prefix sap-jp-assignment-text- |
| P1-1 Dashboard | ✅ useMemo([progress]) + loading skeleton |
| P1-3 进度条 | ✅ LessonHeader client + computed from completedShadowing/Recordings |
| P1-5 波形 | ✅ AnalyserNode getByteTimeDomainData |
| P1-6 blob URL | ✅ audioUrl 字段不再写 ObjectURL |
| P2-1 自评闭环 | ✅ setSelfAssessment(recordingId, score) |
| P2-2 收藏 key | ✅ 砍 favoriteSentences，加 favoriteShadowing，loadProgress 自动迁移 |
| _meta.json | ✅ schemaVersion 1.1.0 |

### 浏览器手测
（每页一句话说"看到/没看到 什么"）

## 关键数据
- content-source-report.md 摘要（贴关键统计）
- data/_meta.json 摘要

## 遗留 / 风险
（写下：Ryan 是否还要跑 TTS / 中文翻译字段空着是否要补 / Substitution drill 暂返回空数组 / 等）

## 验收命令清单（给 Claude）
\`\`\`bash
git -C /Users/openclawxiaoer/sap-hub log --oneline | head -12
git show HEAD:projects/4-sap-training/web/data/_meta.json
cat /Users/openclawxiaoer/sap-hub/logs/content-source-report.md
node -e 'const l=require("/Users/openclawxiaoer/sap-hub/projects/4-sap-training/web/data/lessons.json");
const total = l.reduce((s,x)=>s+x.phrases.length,0); const zero = l.filter(x=>!x.phrases.length).map(x=>x.id);
console.log("total phrases:", total, "zero-phrase lessons:", zero);'
ls /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web/public/audio/phrase | wc -l
ls /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web/scripts/generate-tts.mjs
cd /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web && npm run typecheck
\`\`\`

## 下一步
停手等 Claude 验收。验收通过后 Phase 4（学生 Stepper + 讲师占位扩展 + 移动端 + i18n）。
```

完成后**停手**。

---

## 严禁

1. **不许**编造任何日语句子（违反整 Phase abort）
2. **不许**给 phrases/shadowing 的 chinese 字段填编造的中文翻译（留空字符串）
3. **不许**改 types/track.ts / types/lesson.ts 的字段定义（数据模型在 Phase 1 已定）
4. **不许**改 data/library.json（Phase 2 已定）
5. **不许**接 Auth / DB / S3
6. **不许**升级现有依赖（react / next / typescript / 等）
7. **不许**装新 npm 依赖（generate-tts.mjs 用 Node 内置 fetch + fs 即可）
8. **不许**把 .env.local 或任何 KEY 字符串 commit 进 git
9. **不许**把 mp3 / wav / m4a 文件 commit 进 git（已 .gitignore，sanity check 一次）
10. **不许**自动接 Phase 4

## 阻塞时停手

任何下列情况立刻在 `inbox/need-input-phase3-{YYYYMMDD}.md` 写问题并停止：

- 起手不是 main / 不 clean / Phase 2 commit 不在历史里
- 子任务 1 跑完 ≥ 5 课 0 真句
- 子任务 2 抽检 20 句有 ≥ 1 句含连续 6+ 中文短语
- 子任务 3 跑 TTS 时 Azure Speech 报 403 / 401（凭据错）或 429（限流）
- 子任务 6 AnalyserNode 在 Safari / 老 Chrome 不可用（用 webkitAudioContext fallback）
- typecheck 失败且原因看不出
- build 失败且原因看不出
- 任一手测页面 console 出现红色 error（audio 404 警告除外）

写问题时具体到：哪一步 / 完整命令 + 输出 / 你尝试过什么 / 倾向方案。不要猜。

---

## 任务结束

完成所有子任务、跑通验证、8-10 个 commit、写交接、**停下来等 Claude 验收**。
Phase 4 任务包会在 Phase 3 验收通过后发给你。
