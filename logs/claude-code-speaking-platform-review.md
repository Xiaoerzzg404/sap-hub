# SAP 日语口语训练平台 · 代码评审报告

- **评审人**：Claude（在线日语培训网站架构师视角）
- **评审日期**：2026-05-19（Asia/Tokyo）
- **评审范围**：`/Users/openclawxiaoer/sap-hub` 仓库，重点 `app/`, `components/`, `lib/`, `types/`, `data/`, `scripts/convert-content.mjs`, `projects/4-sap-training/state/sap_jp_training_course.json`, `logs/screen-dev.log`
- **运行验证**：`npm run typecheck` 已通过；`npm run build` 在本评审 sandbox 因外网受限拉 swc 失败，但仓库 logs 显示用户侧 `next dev` 与 `next start` 都已正常 ready，所以**构建本身不是问题**；问题在「跑起来之后到底能不能用」
- **结论一句话**：当前网站是一个**单机本地 MVP 内容展示 + 录音玩具**，**不是**可以放到服务器给多个学生同时使用的在线训练平台，更不是一个能让讲师真正给学生录音点评的教学后台

---

## 1. Executive Summary

### 这个网站现在处在哪一格？

| 阶段 | 是否达到 | 说明 |
|---|---|---|
| 1. 内容展示站 | ✅ 已达到 | 24 课内容、术语、句型、Role Play、Shadowing 都能在浏览器里翻得到 |
| 2. 本地口语训练 MVP | ⚠️ 半达到 | 录音、回放、自评界面都有，但**所有标准音频都 404**（`public/audio/placeholders/` 是空目录），「听」这一环节实际不可用 |
| 3. 可上线内测 | ❌ 不达到 | 没有用户、没有数据库、没有上传、所有学生用同一个浏览器存储 key，**多学生同时用立刻数据混淆** |
| 4. 可商业化生产 | ❌ 远未达到 | 没有 Auth / RBAC / Object Storage / Audit / 备份；不能向学生收钱 |

### 总体结论

1. **「学生角度」的硬伤**是：
   a. 「听」环节断了——`public/audio/placeholders/` 目录里**一个 mp3 都没有**，`logs/screen-dev.log` 显示每个音频都 `404`。所有 Shadowing / Repeat Player / AB Repeat 都失去了灵魂，只能看着标准句**默读**。
   b. 「内容」环节有质量问题——`data/phrases.json` 里大量句子是脚本生造的「本日は、SAP概览与顾问身份建立について確認していきます」这种把中文标题直接塞到日语模板里的不自然句，**违反** Project 4 `_instructions.md` 写明的红线「日语表达要符合真实日本 SAP 项目职场用法，不生造」。这种素材拿去训练，会把学生练成「日本人听不懂」。

2. **「讲师角度」的硬伤**是：
   a. `components/teacher/StudentRecordingReview.tsx` 实际上**就是** `<RecordingHistory />`——它读的是「讲师当前浏览器」的 IndexedDB，**根本不是任何学生的录音**。讲师页面里看不到任何真实学生作业。
   b. 没有任何评分、纠错、留言的写入路径，整个讲师工作流是占位 UI。

3. **「服务器多学生」的硬伤**是：
   a. `lib/audio-storage.ts` 使用浏览器 IndexedDB，数据库名硬编码 `"sap-jp-speaking-recordings"`，没有 `userId` 分桶。
   b. `lib/progress-storage.ts` 使用 `localStorage` key `"sap-jp-speaking-progress-v1"`，同上。
   c. `types/audio.ts:RecordingAttempt.userId` 字段有，但 `RecordingPanel.tsx:143` 永远写死成 `"local-student"`——**全平台所有学生在 ID 层就是同一个人**。
   d. 完全没有后端 / API / DB / Storage / Auth。

4. **架构与代码质量**是：
   a. TS 类型合理、组件分层基本得当，`RecordingPanel` 的录音技术细节（MediaRecorder + IndexedDB + 自动停录 + 自动保存）写得是可用的。
   b. 但 `data/lessons.json` 2.8 MB 通过 `import lessons from "@/data/lessons.json"` 一次性塞进 server bundle，所有 24 课逐字稿 + 528 术语 + 576 句型 + 792 Shadowing 全量加载，**首屏体积和内存占用偏重**，且**完全没有按需加载**。
   c. `WaveformVisualizer` 是**假波形**（`Math.sin(frame + i*4)` 的纯装饰动画），并不连 `MediaStream`——学生录音时看着波形跳，以为系统在测音量，其实没测。

### 一句话给老板看

> 「这是一个本地能跑、能录、能回放，但没有真音频、没有讲师视角、不能多人用的 MVP。从这里到能给学生付费用的在线训练营，**至少还要做 60% 的工程**——主要是音频内容、后端、Auth、对象存储、讲师反馈闭环。」

---

## 2. Scorecard（1-5 分，5 = 已达到生产可用）

| 维度 | 分数 | 说明 |
|---|---|---|
| 学生学习闭环（听→跟→录→回→评→复盘） | **2 / 5** | UI 闭环齐全，但「听」整段断（音频 404），「评」只是 1-5 滑杆且没有同步到讲师那边 |
| 音频训练能力（速度、AB、重复、Shadowing） | **2 / 5** | 速度/AB/重复都已实现，组件设计合理，但**前提是有音频**——目前 0 个真音频 |
| 录音训练能力（MediaRecorder） | **3 / 5** | RecordingPanel 写得可用，pause/resume/maxDuration/autoSave/blob 都对，但只能保存到本地浏览器 |
| 作业提交能力 | **1 / 5** | 录音作业只存本地；文本作业**只有 `<textarea>`，没有任何保存逻辑**——刷新即丢 |
| 讲师点评能力 | **0.5 / 5** | 占位 UI；StudentRecordingReview 实际显示讲师自己浏览器的录音；评分/纠错没有写入路径 |
| 多学生数据隔离 | **0 / 5** | 没有 userId、没有租户、没有 Auth；学生 A 学生 B 共用 IndexedDB/localStorage key |
| 服务器部署准备度 | **1 / 5** | 是 Next.js 15 + RSC，**能部署**，但部署上去后果是「所有人看同一份本地化的空架子」 |
| 数据模型可扩展性 | **2 / 5** | `data/*.json` 类型清晰，迁数据库容易；但缺录音/反馈/进度的 server side 数据模型 |
| UI / UX | **3.5 / 5** | Tailwind + lucide-react，清爽、适合成人；但每课页面信息密度过高，学生「不知道今天从哪开始」 |
| 代码可维护性 | **3.5 / 5** | TS 类型整洁、组件命名清晰、`convert-content.mjs` 单脚本可重跑；但 client/server 边界、巨型 JSON import、内容生造是隐藏的工程债 |

**总分：~18.5 / 50**——「能演示，不能上线」。

---

## 3. Critical Findings

> 按 P0（必须先解决）→ P3（可放心稍后）排序。每条都尽量给出文件 / 行号 / 验收标准。

### P0-1 · 所有标准音频都 404，「听」整段断

- **影响对象**：学生（这是一个口语训练站，无法听标准音）
- **证据**：
  - `scripts/convert-content.mjs:93-95` 生成 `/audio/placeholders/<lesson>_<type>_<index>.mp3` 占位 URL
  - `data/phrases.json[0].audioSrc = "/audio/placeholders/lesson_01_phrase_001.mp3"`
  - `public/audio/placeholders/` **目录存在但为空**（`ls` 返回 0 个文件）
  - `logs/screen-dev.log` 全篇都是 `GET /audio/placeholders/lesson_XX_phrase_YYY.mp3 404 in XXms`，**没有任何一条 200**
- **为什么重要**：训练站三板斧第一斧（听）废了，学生进站不到 30 秒就发现「按播放没声音」
- **建议修复方向**（按成本从低到高）：
  1. 最快：用 TTS（Azure Speech / Google TTS / OpenAI tts-1 / ttsmaker）按 `data/phrases.json` 批量生成 mp3，全部落到 `public/audio/`，做一个 `scripts/generate-tts.mjs`。**TTS 在生造句问题修完之前都是临时手段**
  2. 中期：录真人发音老师录核心 200 条「型」（meeting / 確認 / 提案）+ 模块特定 case-pack，价格 1 句 50-100 日元，2 万日元起
  3. 终态：音频文件不放 `public/`（部署后跟着 server bundle 一起复制太大）；放 S3 / R2 / Cloudfront，前端读 CDN URL
- **验收标准**：
  - 任意一个 Shadowing 卡 / Repeat Player / AB Repeat 点播放有声音
  - dev-server.log 不再出现 `audio/placeholders/.*404`

### P0-2 · 训练素材本身有「日语生造」质量问题，违反 Project 4 红线

- **影响对象**：学生（练错的日语比不练更糟）、品牌
- **证据**：
  - `data/phrases.json[0]`：`"japanese": "本日は、SAP概览与顾问身份建立について確認していきます。"` —— 把课程标题（中文）直接塞进日语模板
  - `data/lessons.json` → lesson_01.shadowingItems[0]：同款生造句
  - `data/roleplays.json` → lesson_01-roleplay-1.dialogue：`"システム上では项目成员根据角色分工进入议题が行われる"` —— 中文短语夹在日语助词中间
  - `scripts/convert-content.mjs:153-180`（生成 phrases）和 :290-340（生成 shadowing）的模板填空逻辑，把 `lesson.title` 直接当 `{{TOPIC}}` 塞
  - `_instructions.md` 「红线」明确写：「日语表达要符合真实日本 SAP 项目职场用法，不生造」
- **为什么重要**：训练站的本质是「让中国 SAP 顾问在日本项目里能开口」，素材生造 = 教错语
- **建议修复方向**：
  1. `data/lessons.json`「Lesson 详情页一线展示」的部分必须从 `projects/4-sap-training/SAP日语培训/output/lesson_XX_v4_teacher_focused/` 真实素材（teacher_full_script_slide_by_slide.md / case_pack_appendix_all_modules.md）抽，**不要再用 convert 脚本批量生成**
  2. `convert-content.mjs` 改为「只解析、不生成」：找不到真实日语句子的就跳过，宁可 lesson_01 只有 10 句真句，不要 33 句生造句
  3. 找日语母语者（或日本项目 senior 顾问）抽样校 lesson_01 / 03 / 05 / 07 / 10 共 5 课，确认 phrases / shadowing / roleplay.dialogue 没有 mojibake 风格的中日文夹杂
- **验收标准**：随机抽 20 句日语，0 句包含原始中文短语（中文术语/产品名除外，如 SAP / S/4HANA）

### P0-3 · 「讲师专区」看到的是讲师自己浏览器的录音，不是学生的

- **影响对象**：讲师
- **证据**：
  - `components/teacher/StudentRecordingReview.tsx` 全文：`return <RecordingHistory />;`
  - `components/audio/RecordingHistory.tsx:21` 调用 `listRecordings()` —— `lib/audio-storage.ts:38` 读的是**当前浏览器**的 IndexedDB `sap-jp-speaking-recordings`
  - 没有任何 fetch / API / userId 过滤
- **为什么重要**：这是讲师专区**最核心**的功能，**实际上不存在**；点开 `/teacher` 看不到任何学生作业，讲师走完 onboarding 就劝退
- **建议修复方向**：
  1. 这个 component 不要复用 `RecordingHistory`，写一个 `<TeacherStudentRecordingList />`，从 `GET /api/teacher/recordings?lessonId=&studentId=&practiceType=&status=` 拉服务器数据
  2. 在没有后端之前，**先把这个 UI 标成「需要后端，待接入」的占位卡**，不要欺骗讲师以为能用
- **验收标准**：讲师访问 `/teacher` 看不到的录音 ≠ 自己刚才在另一标签页录的录音

### P0-4 · 多学生数据完全不隔离

- **影响对象**：部署、安全、所有学生
- **证据**：
  - `lib/audio-storage.ts:5` `const DB_NAME = "sap-jp-speaking-recordings";` —— **没有 per-user 命名空间**
  - `lib/progress-storage.ts:5` `const KEY = "sap-jp-speaking-progress-v1";` —— 同上
  - `components/audio/RecordingPanel.tsx:143` `userId: "local-student",` —— 所有录音的 userId 永远是 `"local-student"`
  - 没有任何 `useAuth` / `useSession` hook，没有 NextAuth、没有 Clerk、没有 Cookie session
- **为什么重要**：
  - 同一台共享电脑：学生 A 录完离开，学生 B 打开就能看 A 的所有录音 + 自评
  - 不同电脑（部署后）：每个学生都在自己的浏览器里、看似没问题，但「讲师看学生录音」永远做不到，因为数据从未离开过浏览器
- **建议修复方向**：见第 6/7/8 节
- **验收标准**：学生 A 登录后看到的录音列表 ≠ 学生 B 登录后看到的录音列表（在同一台浏览器测试也成立）

### P0-5 · 录音文件只在浏览器 IndexedDB，永不上传

- **影响对象**：学生（清缓存即丢）、讲师（看不到）、运营（无法做内容质量回流）
- **证据**：
  - `lib/audio-storage.ts:saveRecording()` 全部本地操作；没有 `fetch("/api/recordings", ...)`、没有 `S3.upload()`
  - `types/audio.ts:RecordingAttempt.blob?: Blob` —— blob 直接 put 进 IndexedDB
  - `recordingToObjectUrl()` 用 `URL.createObjectURL(blob)` —— 这是浏览器内存 URL，跨设备/跨用户无法访问
- **为什么重要**：训练站的核心商业价值 = 讲师能听学生录音、给改进；目前这条路完全不通
- **建议修复方向**：
  - 加 `POST /api/recordings` 接 S3/R2 签名直传（pre-signed URL），DB 只存 metadata
  - 加 `recordings` 表（schema 见第 8 节）
- **验收标准**：学生上传成功后，讲师在 `/teacher` 看到这条录音的「学生 / 课次 / 时长 / 试听」

### P0-6 · 文本作业「输入即丢」

- **影响对象**：学生（写了不算）、讲师（看不到）
- **证据**：
  - `app/assignments/page.tsx:64` `<textarea ... placeholder="本地输入区，后续可接入后端作业提交" />` —— textarea **没有 `value` 也没有 `onChange`**，完全是 uncontrolled，刷新即丢
  - `components/lesson/LessonAssignment.tsx:28` 同款 placeholder
- **为什么重要**：所有「词汇作业 / 句型作业」类作业都是花瓶
- **建议修复方向**：
  - 短期：受控组件 + `localStorage`（per-user / per-assignment key）
  - 中期：`POST /api/assignments/:id/submit` 落数据库
- **验收标准**：刷新作业页，已填写内容仍在

---

### P1-1 · Dashboard 永远显示 lesson_01

- **影响对象**：学生
- **证据**：`app/dashboard/page.tsx:12`
  ```ts
  const todayLesson = allLessons.find((lesson) => !progress?.completedLessons.includes(lesson.id)) ?? allLessons[0];
  ```
  这行在 render body 顶层执行；首次 render 时 `progress === null`，所以 `todayLesson = allLessons[0]`；之后 `useEffect` 把 `progress` 设上去会触发重渲染，**但 todayLesson 在 render body 顶层只是普通变量、会重算一次**。看起来好像没问题，但因为 `progress?.completedLessons.includes(lesson.id)` 当 `progress` 为 null 时 `?.` 短路返回 undefined，`!undefined = true`，所以 `.find` 永远返回 `allLessons[0]`——首次渲染锁死
- **为什么重要**：学生看到的「今日任务」永远是第 1 课，无论已学到第几课
- **建议修复方向**：把 `todayLesson` 包进 `useMemo([progress])`；初次未加载时显示骨架屏 / Loading，不要默认渲染 `allLessons[0]`
- **验收标准**：完成 lesson_01 后 Dashboard 推荐第 2 课

### P1-2 · 学生不知道「今天该练什么」

- **影响对象**：学生
- **证据**：`/dashboard` 只有「推荐学习」一张卡，**没有今日推荐顺序**（先听术语？先 Shadowing？还是先 30 秒？）。课内页面 (`/courses/lessons/lesson_01`) 一次性甩出 8 大 section（术语 / 句型 / 逐字稿 / Shadowing / Drill / 30 秒 / 60 秒 / Role Play / 作业 / 自评）——成人职业训练，**没有任何学习路径引导**
- **为什么重要**：学习能否坚持 = 「下一步明确」；信息密度过高会让学生秒劝退
- **建议修复方向**：
  1. 每课加一个 5-step「今日训练路径」组件：术语预热 5min → 句型听读 10min → Shadowing 10min → 30 秒输出 10min → 60 秒顾问输出 + 录音作业 15min
  2. Lesson page 用 Tab / Stepper，一次只展示当前 step，不要全部铺平
- **验收标准**：学生进入 lesson_01，肉眼可见「下一步」按钮

### P1-3 · 进度状态在 lesson 详情页不反映

- **影响对象**：学生
- **证据**：`components/lesson/LessonHeader.tsx:18` `<ProgressBar value={0} label="本地完成进度" />` —— 写死 `value={0}`
- **为什么重要**：进度条永远 0%，学生体感「努力没记到」
- **建议修复方向**：把 `value` 算出来（已完成 shadowing / 总 shadowing 比例之类）
- **验收标准**：完成跟读 1 条后，进度条 > 0

### P1-4 · 大 JSON 一次性 import 到 server bundle

- **影响对象**：性能、部署体积
- **证据**：
  - `lib/content-loader.ts` 顶层 `import lessons from "@/data/lessons.json"` 把 2.8 MB JSON 全量拉进 server bundle
  - 几乎每个页面都 `import { allLessons } from "@/lib/content-loader"` 触发整包加载
  - Sidebar / Header 不需要 lessons 但 layout 是 server component，跨 page 共享 bundle 时也算压力
- **为什么重要**：cold start RAM 占用、首屏 TTFB、Vercel 函数 unzip 慢、客户端 client-tree 序列化可能更慢
- **建议修复方向**：
  - 改成 `getLesson(id)` 时 `await import(`@/data/lessons/${id}.json`)` 按需读
  - 或拆 `data/lessons/{lesson_01.json ... lesson_24.json}`，content-loader 暴露 `getLesson(id)` 异步函数
- **验收标准**：build 产物里没有任何单文件 chunk > 1 MB

### P1-5 · 「波形」是装饰动画，不是真实音量

- **影响对象**：学生（误以为在录、其实没监测）
- **证据**：`components/audio/WaveformVisualizer.tsx` 全文使用 `Math.sin(frame + i * 4)`，没有 `AnalyserNode` 也没有 `MediaStream` 输入
- **为什么重要**：UI 撒谎 = 信任崩塌；而且没有实际音量反馈学生不知道有没有靠近麦克风
- **建议修复方向**：
  - 把 `MediaRecorder` 的 stream 同时接 `AudioContext.createMediaStreamSource() → AnalyserNode.getByteTimeDomainData()` 拿真实音量
  - 或者改 label 叫「录音指示」，去掉动态柱
- **验收标准**：贴着麦说话柱子跳，远离麦柱子平

### P1-6 · 录音播放用 `audioUrl: activeUrl` 存 Blob URL 是坑

- **影响对象**：稳定性
- **证据**：`components/audio/RecordingPanel.tsx:148` `audioUrl: activeUrl,` —— 把 `URL.createObjectURL(nextBlob)` 的结果存进 IndexedDB
- **为什么重要**：`URL.createObjectURL()` 返回的是**当前页面会话**的 blob URL，刷新后这个 URL 就失效；`recordingToObjectUrl` 会优先用 `recording.audioUrl`，如果哪天 blob 字段丢了就播不了
- **建议修复方向**：不要把 blob URL 写库，库里只存 blob（已经做了）；读取时再 `URL.createObjectURL(item.blob)`，并在卸载时 `revokeObjectURL`
- **验收标准**：刷新页面后历史录音仍能播放、且控制台无 `Not allowed to load local resource`

### P1-7 · `generateStaticParams` 把 24 课都静态化，但里面有大量 client 交互

- **影响对象**：部署、SSG/SSR 一致性
- **证据**：`app/courses/lessons/[lessonId]/page.tsx:18-20`：
  ```ts
  export function generateStaticParams() {
    return allLessons.map((lesson) => ({ lessonId: lesson.id }));
  }
  ```
  页面内嵌的 ShadowingCard / MicroTrainingTimer / RecordingPanel 都是 `"use client"`；混合没问题，但 24 个静态页加上每页内联 12000+ 字 transcriptMarkdown，build 产物会膨胀
- **建议修复方向**：考虑 `dynamicParams = true` + 不 SSG，让首屏从 DB 读；或者 transcriptMarkdown 拆 server fetch
- **验收标准**：build 产物 < 100 MB 且每页 .html < 500 KB

---

### P2-1 · 自评分数没存进 progress

- **证据**：`components/speaking/SelfAssessmentForm.tsx` 是受控组件但 `value` 不上传到任何 store，`onChange` 也只是回调；`review` 页面读 `progress.selfAssessments`，但**没有任何代码把自评写进 progress.selfAssessments**——`progress-storage.ts` 没暴露 `setSelfAssessment` 方法
- **影响**：复盘中心「低分自评项目」**永远空**
- **修复**：增加 `progress-storage.ts:setSelfAssessment(id, score)`，在 RecordingPanel 保存录音 → 同时写自评

### P2-2 · 「收藏难句」与「收藏术语」逻辑不闭环

- **证据**：`components/speaking/ShadowingCard.tsx:32-34` 调用 `toggleProgressList("favoriteSentences", item.id)`，但 `favoriteSentences` 是 `Phrase id` 吗？ShadowingItem 用的是 `lesson_01-shadow-phrase-1` 这种 id；而 `app/review/page.tsx:16` `allPhrases.filter((phrase) => progress?.favoritePhrases.includes(phrase.id))` —— **取的是 favoritePhrases 不是 favoriteSentences**，命名不一致，收藏完打不开
- **修复**：统一 key 命名，或区分 phrase 收藏 vs sentence 收藏

### P2-3 · ClassroomScriptViewer 用 `stripMarkdown` 暴力降级

- **证据**：`components/lesson/ClassroomScriptViewer.tsx:8` 用 `stripMarkdown(markdown, 5000)` 把逐字稿全部展平为纯文本——`#`、`**bold**`、`>` 引用全没了，对一份「老师口播 + 学生跟读 + 板书」的逐字稿，**结构丢光**
- **修复**：用 `react-markdown` 或 `marked + dompurify` 渲染原 markdown；切忌让讲师拿手机看一整块灰墙

### P2-4 · 术语库 / 句型库都用 `slice(0, 8)` 和 `slice(0, 48)` 截断

- **证据**：`app/glossary/page.tsx:31` 只渲染前 8 张术语卡；`app/phrasebook/page.tsx:16` 只渲染前 48 条
- **影响**：搜不到的词永远搜不到（已经在搜索后再 slice）；学生以为术语库只有 8 个
- **修复**：搜索后用 react-window / 分页 / 虚拟化，不要切 slice

### P2-5 · TS 类型小漏洞

- `types/audio.ts:RecordingAttempt.audioUrl: string` 应为 `string | undefined`（保存进 IndexedDB 之后只该用 blob，audioUrl 当临时字段更好）
- `types/audio.ts:RecordingAttempt.userId: string` 是字符串但全程写死 `"local-student"`，建议先 narrow 成 `userId: "local-student"` 表示 MVP 限制，迁移时一眼看到
- `types/lesson.ts:MicroTraining.durationSec: 30` 字面量类型；ConsultantOutput.durationSec: 60 同——硬编码后未来想做 45 秒挑战课要改类型

---

### P3-1 · 无 ARIA / 键盘可访问性

- 录音按钮组只用 `disabled` 不加 `aria-busy / aria-live`，听障学生对录音状态无感
- `<audio controls>` 没有可见 transcript 替代
- 速度按钮和 AB 按钮没有 `aria-pressed`

### P3-2 · 移动端布局未验证

- Sidebar 用 `hidden lg:block`，移动端没有任何导航菜单
- Lesson 详情页 8 大 section 在 sm 下会非常长

### P3-3 · 错误处理不足

- `RecordingPanel` 捕到所有错误后只 setError 文案，没有 telemetry/log
- IndexedDB 操作失败时没有 retry / fallback
- 没有 ErrorBoundary（Next.js 15 推荐 `error.tsx` per segment）

### P3-4 · 没有 i18n 区分中文 UI 与日语内容

- 中文 UI 和日语训练句直接同字号、同字体；建议给日语句加 `lang="ja"` + 专用字体（避免 Chrome 在 zh-CN 页面里用宋体渲染日语，看起来不像日语母语者写的）

### P3-5 · 没有 lint / format / pre-commit

- `package.json` 有 `next lint` 但没接入 CI；建议加 `husky + lint-staged + prettier`

---

## 4. Student Workflow Review（按真实学生路径）

### Step 1：进入首页 `/`
- ✅ 价值主张清晰：「面向成人 SAP 顾问的日本项目口语训练」
- ❌ 「开始第 01 课」按钮一进去就把学生扔到信息密度过高的课内页
- ❌ 没有「未注册 / 试听 / 30 秒看看」的轻入口
- **结论**：可以登场，但留存做不好

### Step 2：选择课程 `/courses`
- ✅ 24 课列表清楚，可点
- ❌ 列表没有「学到第几课」「学了多久」「下次该哪一课」
- ❌ 没有难度 / 时长 / 模块标签筛选

### Step 3：听标准音频
- ❌ **整个 step 不可用**（参 P0-1）
- 学生第一次点播放无声，会以为系统坏了

### Step 4：Shadowing `/speaking/shadowing` 或课内
- ⚠️ UI 完整：标准句、中文、播放器、跟读次数、收藏、录音、自评
- ❌ 音频 404 → 学生只能默读
- ❌ 跟读次数纯手动 +1，没有任何「检测到你说了 N 遍」逻辑
- ❌ 三句 Shadowing 完了之后没有「下一组」按钮，需要返回 dropdown 切换 lesson/scenario

### Step 5：录音
- ✅ 麦克风权限、暂停、停止、删除、保存都对
- ⚠️ 但「保存」之后没有任何「上传给讲师」的入口
- ❌ Waveform 是假的（P1-5）

### Step 6：回放
- ✅ 历史录音卡列出来、`<audio controls>` 能放
- ❌ 没有对比标准音的能力（学生想知道差距）
- ❌ 没有「打分 / ASR 转写 / 错音标红」反馈

### Step 7：30 秒训练 `/speaking/micro-training`
- ✅ Prepare 30s → Recording 30s 倒计时设计合理
- ✅ `autoSaveOnStop` 录到时间自动保存
- ❌ Prepare 阶段「30 秒看 prompt 准备」对成人初学者太短，建议可选 60s/90s
- ❌ 30 秒结束后只 self-assessment，没有「再来一次」按钮

### Step 8：60 秒输出 `/speaking/consultant-output`
- ✅ 6 字框架 (background / input / system / output / risk / next-step) 展示清晰
- ✅ 模板示范句给得不错
- ❌ 没有「按 4 秒一格倒数」可视化、学生不知道说到哪一段
- ❌ 录完没自动按框架 6 段切片回放

### Step 9：Role Play `/roleplay`
- ✅ A/B 切换 + 整段录音三种模式都给到
- ✅ 必含日语句型 chip 化展示
- ❌ 但 RolePlay.dialogue 里含中日文混杂句（P0-2），学生跟着练就练废了
- ❌ 没有「A 录完等 B 录」的对练流程（双人/AI 陪练入口）

### Step 10：作业提交 `/assignments`
- ❌ textarea 无 state 即丢（P0-6）
- ❌ 录音作业保存只在本地，讲师看不到（P0-5）
- ❌ 状态字段「未开始 / 进行中 / 已完成 / 待讲师点评」**只是装饰文字**，没有逻辑

### Step 11：复盘 `/review`
- ⚠️ UI 有「收藏难句 / 待复习术语 / 低分自评 / 历史录音」四块
- ❌ 自评数据从未写入 progress（P2-1），「低分自评」永远空
- ❌ 收藏 key 不闭环（P2-2），收藏的 shadowing 不会出现

**学生闭环结论**：UI 走完了一遍，但「听」断、「评」无回流、「讲师反馈」缺失，**复盘中心是一只死循环**。

---

## 5. Teacher Workflow Review（按真实讲师路径）

### Step 1：查看课程 `/teacher`
- ✅ 顶部 4 个 metric（课程设计稿 24 / 课堂逐字稿 24 / 待复核术语 N / 缺失课程 0）
- ✅ 课程逐字稿速览只显示 6 个，可下钻——但点不进去（没有「查看全文」入口）
- ❌ 逐字稿被 `stripMarkdown` 压扁，结构丢

### Step 2：查看学生录音
- ❌ **彻底不可用**：StudentRecordingReview = RecordingHistory（P0-3）
- 讲师只能看到自己上次在浏览器测的录音

### Step 3：筛选作业
- ❌ 没有任何筛选 UI：按学生 / 课次 / 作业类型 / 状态都没有
- ❌ 没有「已批改 / 未批改」状态

### Step 4：点评反馈
- ❌ 没有任何写入路径：评分输入框、纠错输入框、批改按钮**完全没实现**
- `types/audio.ts:RecordingAttempt.teacherFeedback` 类型有定义，**代码里 0 处赋值**

### Step 5：查看待复核术语 `/teacher/review-terms`
- ✅ 表格完整：课次 / 原始 / 建议 / 日语采用 / 理由 / mustReview / 状态 / 备注
- ❌ 但**表格是只读的**——没有「采用 / 拒绝 / 留言」按钮，无法把 pending 改成 reviewed
- ❌ 没有按 lessonId / status / mustReview 的筛选

### Step 6：查看课程质量问题
- ✅ 自动列出 terms/phrases/shadowing/rolePlays/microTrainings 任一为 0 的课
- ❌ 没有把「日语生造」「URL 404」「audio 404」算进缺失检查里——这才是真正的质量问题

**讲师闭环结论**：当前 `/teacher` 距离真实教学后台**至少差一个完整的 server + DB + Auth + 反馈写入 API + UI 表单**。可以理解为「占位骨架，不是后台」。

---

## 6. Production Readiness Review

| 能力 | 当前 | 缺什么 |
|---|---|---|
| Auth（登录 / 注册 / SSO） | ❌ 完全没有 | 选 NextAuth (Auth.js v5) / Clerk / Supabase Auth。最小：邮件 + 密码 + JWT cookie |
| Session / Identity | ❌ 没有 | 服务端中间件 `middleware.ts` 校验 session，传 `userId` 进 API |
| Database | ❌ 没有 | 选 Postgres (Neon / Supabase / Railway) + Prisma 或 Drizzle |
| Object Storage（录音） | ❌ 没有 | S3 / R2 / Supabase Storage；用 presigned URL 直传 |
| RBAC（学生 / 讲师 / 管理员） | ❌ 没有 | DB users.role + middleware 校验 + route guard |
| Student/Teacher isolation | ❌ 数据共用 IndexedDB | 服务端 query 必带 `where userId = $authUser`；讲师可看下属学生 |
| Upload API（录音） | ❌ 没有 | `POST /api/recordings/sign` 拿 presigned URL；`POST /api/recordings` 落库 |
| Feedback API（讲师评分） | ❌ 没有 | `POST /api/recordings/:id/feedback` + WebSocket / SSE 推给学生 |
| Audit log（谁改了什么） | ❌ 没有 | `audit_events` 表，敏感操作埋点 |
| Backup | ❌ 没有 | DB daily snapshot + S3 versioning |
| Privacy / Security | ⚠️ 风险高 | 录音里可能涉及学员公司项目实名、客户信息；需 KMS 加密、签名 URL 有效期、强制 https |
| 多设备 / 多浏览器 | ❌ 不行 | 任何 storage 都是浏览器本地 |
| 防滥用 | ❌ 没有 | 录音上传无限制 → 单学生一晚上能塞爆 S3；需 rate limit + 单录音 ≤ X MB |

**部署到 Vercel 是否可行？**——可以，但部署上去的就是个**「无法多人用」的本地 MVP**。Vercel function 是 stateless，IndexedDB 本就在客户端，所以「跑得起来」≠「能给多人用」。

---

## 7. Recommended Target Architecture

> 务实路线，跟当前 Next.js 15 + RSC 仓库**最小侵入**衔接。

### 7.1 概览图

```
┌─────────────────────────────────────────────────────────┐
│  Browser (student / teacher)                            │
│    Next.js 15 App Router                                │
│    - Server Components: SSR 内容（课程文本）             │
│    - Client Components: 录音 / 播放 / 自评              │
│    - Auth.js v5 session cookie                          │
└──────────────────┬──────────────────────────────────────┘
                   │ HTTPS
       ┌───────────┴──────────────┐
       │  Next.js API routes      │
       │  (/api/*)                │
       │  - withAuth() middleware │
       │  - Drizzle ORM           │
       └───────────┬──────────────┘
                   │
        ┌──────────┼──────────────┬────────────────┐
        │          │              │                │
   ┌────▼───┐ ┌────▼───┐  ┌──────▼─────┐  ┌──────▼─────┐
   │Postgres│ │  R2 /  │  │ Resend (邮件│  │ TTS API    │
   │(Neon)  │ │  S3    │  │ 验证)       │  │(Azure/OpenAI│
   │+Drizzle│ │(录音)  │  │             │  │)           │
   └────────┘ └────────┘  └────────────┘  └────────────┘
```

### 7.2 Frontend（最小改动）

- 沿用 Next.js 15 App Router
- 把 `lib/audio-storage.ts` / `lib/progress-storage.ts` 抽象成 interface：
  ```ts
  // lib/storage/interface.ts
  export interface RecordingStorage {
    save(input: NewRecording): Promise<RecordingAttempt>;
    list(filter: { lessonId?: string; userId?: string }): Promise<RecordingAttempt[]>;
    delete(id: string): Promise<void>;
  }
  ```
  两个实现：`local-indexeddb.ts`（保留 MVP 模式）+ `api-recording-storage.ts`（生产）
- 用 env `NEXT_PUBLIC_STORAGE_MODE=local|api` 切换；可灰度
- 加 `<AuthProvider>` 包 layout，所有 client component 通过 `useSession()` 拿 `userId`

### 7.3 Backend / API（Next.js Route Handler）

```
app/api/auth/[...nextauth]/route.ts   # Auth.js
app/api/recordings/sign/route.ts      # POST 拿 presigned URL
app/api/recordings/route.ts           # POST 落库 / GET 列表
app/api/recordings/[id]/feedback/route.ts  # PATCH 讲师点评
app/api/assignments/[id]/submit/route.ts   # POST 作业
app/api/progress/route.ts                  # GET/PATCH 学生进度
app/api/teacher/students/route.ts          # 讲师列表学生
app/api/teacher/recordings/route.ts        # 讲师筛选录音
```

每个 handler 都通过 `withAuth(handler, { roles: ["student"] })` 包一层。

### 7.4 Database（Postgres + Drizzle）

10 张表起步（详见第 8 节）。Neon free tier 足够前 100 个学员。

### 7.5 Recording Storage（R2 / S3）

- Bucket：`sap-jp-recordings`，私有
- Key 规则：`audio/{userId}/{lessonId}/{recordingId}.webm`
- 直传：客户端 `PUT` 到 presigned URL（5min 有效期）
- 读：讲师拿 `GET` presigned URL（10min 有效期），不直接对外暴露 bucket
- 大小限制：单文件 ≤ 10 MB，单学生月度配额 ≤ 1 GB
- Lifecycle：超过 1 年的录音自动归档冷存储

### 7.6 Auth / Session

- **Auth.js v5（NextAuth 升级版）** + Postgres adapter
- 登录方式：邮箱 + magic link（推荐）或邮箱 + 密码
- session 通过 `cookies()` 拿，`middleware.ts` 守每个 `/api/**` 和 `/teacher/**`
- `users.role` enum: `student | teacher | admin`

### 7.7 Teacher Feedback Flow

1. 讲师在 `/teacher/recordings` 看列表（按学生 / 课次 / 状态筛选）
2. 点开一条 → `/teacher/recordings/[id]` 详情页
3. 听录音、看 prompt、看学生自评 → 填评分（5 维）+ 纠正表达 + 留言 + （可选）上传讲师示范音频
4. `PATCH /api/recordings/:id/feedback` 落 `teacher_feedback` 表 + 触发 SSE / 邮件通知学生

### 7.8 Deployment Option

**推荐 A：Vercel + Neon + Cloudflare R2**
- Vercel hosts Next.js（front + API）
- Neon hosts Postgres
- R2 hosts audio
- 月成本 < 50 USD（前 100 学员）

**备选 B：Render / Railway 一体托管 + S3**
- 更适合需要 long-running task（比如批量 TTS）的场景
- 单价稍高

---

## 8. Data Model Suggestions

> Drizzle schema 草稿。表名小写下划线。

### 8.1 `users`

```ts
id           uuid PK
email        text UNIQUE NOT NULL
display_name text
role         enum('student','teacher','admin') NOT NULL default 'student'
class_id     uuid REFERENCES classes(id) NULL  -- 学生归属班
locale       text default 'zh-CN'
created_at   timestamptz
updated_at   timestamptz
```

### 8.2 `classes`（班级，先建一张能跑）

```ts
id          uuid PK
name        text  -- "2026 春季 FICO 实战营"
teacher_id  uuid REFERENCES users(id)
starts_at   date
ends_at     date
created_at  timestamptz
```

### 8.3 `enrollments`

```ts
id          uuid PK
class_id    uuid REFERENCES classes(id)
student_id  uuid REFERENCES users(id)
status      enum('active','paused','completed','dropped')
enrolled_at timestamptz
unique(class_id, student_id)
```

### 8.4 `lessons`

```ts
id              text PK  -- 'lesson_01'
order           int
title           text
sap_modules     text[]
project_phase   text[]
summary         text
content_jsonb   jsonb   -- 当前 data/lessons.json[i] 的内容（迁移期）
transcript_md   text
updated_at      timestamptz
```

### 8.5 `phrases` / `glossary_terms`（独立表，方便统一查询）

```ts
phrases:
  id           text PK
  lesson_id    text FK
  category     text
  japanese     text
  chinese      text
  usage        text
  replaceable_parts text[]
  audio_url    text
  audio_status enum('missing','tts','human')
  created_at   timestamptz

glossary_terms:
  id           text PK
  lesson_id    text FK
  chinese      text
  english_or_sap text
  japanese     text
  reading      text
  module       text
  project_phase text
  example_sentence text
  needs_review boolean
  audio_url    text
```

### 8.6 `assignments`

```ts
id           text PK
lesson_id    text FK
type         enum('vocabulary','phrase','recording','consultant-output','text')
title        text
prompt       text
target_duration_sec int  -- 30 / 60 NULL
```

### 8.7 `assignment_submissions`

```ts
id               uuid PK
assignment_id    text FK
student_id       uuid FK users(id)
recording_id     uuid FK recordings(id) NULL  -- 录音作业
text_content     text NULL  -- 文本作业
self_assessment  jsonb       -- {pronunciation:int, ...}
status           enum('draft','submitted','pending-review','reviewed')
submitted_at     timestamptz
created_at       timestamptz
updated_at       timestamptz
```

### 8.8 `recordings`

```ts
id              uuid PK
student_id      uuid FK users(id)
lesson_id       text FK
practice_type   enum('shadowing','micro-training','consultant-output','role-play')
prompt_text     text
target_japanese text
storage_key     text  -- 'audio/{userId}/{lessonId}/{id}.webm'
mime_type       text
duration_sec    int
size_bytes      int
self_assessment jsonb
status          enum('uploading','ready','flagged','deleted')
created_at      timestamptz
```

### 8.9 `teacher_feedback`

```ts
id              uuid PK
recording_id    uuid FK recordings(id)
teacher_id      uuid FK users(id)
score_overall   int   -- 1-5
score_dim       jsonb -- {pronunciation,fluency,naturalness,sap_accuracy,consultant_like}
comment         text
corrected_japanese text
model_recording_id uuid NULL FK recordings(id)  -- 讲师示范音频也存 recordings
created_at      timestamptz
```

### 8.10 `progress_events`（埋点式累积 vs. 单行状态）

```ts
id          uuid PK
student_id  uuid FK
type        enum('shadowing_done','recording_saved','term_favorited','phrase_favorited','self_assessment_saved','lesson_started','lesson_completed','assignment_submitted')
lesson_id   text NULL
ref_id      text NULL  -- shadow id / term id / phrase id
payload     jsonb
created_at  timestamptz
```

进度 derived from events（更灵活），dashboard 用 materialized view 汇总。

### 8.11 `favorites`

```ts
id          uuid PK
student_id  uuid FK
kind        enum('term','phrase','sentence')
ref_id      text
created_at  timestamptz
unique(student_id, kind, ref_id)
```

### 8.12 `review_terms`（ASR / 术语待复核）

```ts
id            text PK
lesson_id     text FK
raw_text      text
suggestion    text
adopted_japanese text
reason        text
must_review   boolean
status        enum('pending','reviewed','ignored')
reviewer_id   uuid FK users(id) NULL
review_memo   text
reviewed_at   timestamptz
```

---

## 9. Prioritized Fix Plan for Codex

> 给 Codex 一个能直接动手的路线，每一步都落到具体文件/模块。

### Step 1 · 一周内做完，把「内容展示 + 本地训练 MVP」改成「**本地训练能用**」

1.1 **生成真音频（必做）**
- 新建 `scripts/generate-tts.mjs`，读 `data/phrases.json`，调 Azure Speech 或 ttsmaker 批量生成 mp3
- 落 `public/audio/phrase/{phrase_id}.mp3`、`public/audio/shadowing/{item_id}.mp3`、`public/audio/term/{term_id}.mp3`
- 同步改 `convert-content.mjs` 的 `placeholderAudio` 让它返回新路径
- 验收：dev-server.log 0 个 404

1.2 **修日语生造（必做）**
- 改 `scripts/convert-content.mjs`：phrases / shadowing 生成逻辑改为「优先从 lesson `01_teacher_core/01_teacher_full_script_slide_by_slide.md` 抓真实日语句」，**不再用中文 lesson.title 填模板**
- 抓不到真句的就跳过这条，不生造
- `data/lessons.json` 重跑
- 验收：随机抽 20 句日语 0 句包含中文短语

1.3 **修 Dashboard 永远 lesson_01（P1-1）**
- `app/dashboard/page.tsx` 把 `todayLesson` 包 `useMemo([progress])`

1.4 **修 textarea 即丢（P0-6）**
- `app/assignments/page.tsx` 和 `components/lesson/LessonAssignment.tsx` 改受控组件 + localStorage（带 assignmentId）

1.5 **修自评不闭环（P2-1）**
- `lib/progress-storage.ts` 加 `setSelfAssessment(recordingId, score)`
- `SelfAssessmentForm` 接 `recordingId` prop，onChange 时写库
- 验收：复盘中心「低分自评」能显示

1.6 **修讲师专区误导（P0-3）**
- `components/teacher/StudentRecordingReview.tsx` 改成「需后端，待接入」占位卡，标红字告诉讲师当前不可用
- 验收：讲师不会以为自己浏览器里的录音 = 学生录音

### Step 2 · 两到四周做完，**接后端能多学生用**

2.1 **加 Auth（Auth.js v5 + Neon Postgres）**
- 装 `@auth/core @auth/drizzle-adapter drizzle-orm drizzle-kit pg`
- 建 `lib/db/schema.ts` 按第 8 节 schema
- 建 `app/api/auth/[...nextauth]/route.ts`
- 建 `app/(auth)/login/page.tsx` + magic link
- 建 `middleware.ts` 守 `/teacher`、`/api/*`

2.2 **加录音上传 API + R2/S3 直传**
- 装 `@aws-sdk/client-s3 @aws-sdk/s3-request-presigner`
- 建 `app/api/recordings/sign/route.ts`：返回 presigned PUT URL
- 建 `app/api/recordings/route.ts`：客户端上传完后 POST 落 metadata
- 改 `components/audio/RecordingPanel.tsx:saveCurrentRecording`：sign → PUT → POST metadata（保留 IndexedDB 作为 offline fallback）
- 验收：保存录音后服务器 R2 桶里看得到对应 webm 文件

2.3 **讲师 feedback API + UI**
- 建 `app/api/recordings/[id]/feedback/route.ts`（PATCH）
- 建 `app/teacher/recordings/page.tsx`（学生 / 课次 / 状态筛选）
- 建 `app/teacher/recordings/[id]/page.tsx`（详情 + 评分 + 纠错表单）
- 验收：讲师评分后学生侧能看到 `teacherFeedback`

2.4 **进度从 events 派生 + 服务端化**
- 建 `app/api/progress/events/route.ts`：所有 `markProgress` / `toggleProgressList` 改 `POST /api/progress/events`
- localStorage 保留作为 fallback / 离线 cache
- 验收：同一学生换浏览器登录，进度仍在

2.5 **lessons 数据从 DB 读**
- 把 `data/lessons.json` 迁进 `lessons` 表 + 拆 `phrases`/`glossary_terms`/`shadowing_items`/`roleplays` 子表
- `content-loader.ts` 改成 `await getLessonFromDb(id)`
- 验收：build 产物里不再有 2.8 MB 的 JSON chunk

### Step 3 · 上线前必做

3.1 **RBAC 守卫**：所有 API 加 `requireRole(['student' | 'teacher' | 'admin'])`；UI 路由通过 middleware 守

3.2 **rate limit + 容量**：`@upstash/ratelimit`；单学生月度录音 ≤ 1 GB

3.3 **错误监控**：Sentry / Highlight 接 Next.js

3.4 **隐私 / 合规**
- 在「保存录音」按钮上方加显眼说明：「录音会上传到服务器供你和讲师回放，不会用于训练模型/不会公开」
- 加 `/privacy` 页 + 加同意勾选
- DB 加 `recordings.deleted_at`（软删除），保留 30 天再硬删

3.5 **备份**：DB daily snapshot；R2 versioning + lifecycle

3.6 **可访问性最低限**
- Lesson 详情页关键交互加 aria 属性
- 录音按钮 `aria-busy` / `aria-pressed`
- 移动端 Sidebar 改成抽屉 / 底栏

3.7 **lint + format + CI**
- husky + lint-staged + prettier
- GitHub Actions：PR 上跑 typecheck + lint + build

3.8 **观测埋点**
- progress_events 同时写一份到 PostHog 或类似
- 留存关键漏斗：注册→开课→第一句 Shadowing→第一段录音→第一次自评→看到讲师反馈

---

## 10. Final Recommendation

### 现在是否可以给学生试用？

**可以给 1-2 个内测学生在本人电脑、单浏览器、Ryan 监督下试用**，但前提是：

1. **必须先修 P0-1（音频 404）和 P0-2（日语生造）** —— 否则学生第一节课就明白「这平台没法练」
2. **必须当面告诉学生**：
   - 录音只存在你自己浏览器里，**不要清缓存**
   - 讲师**看不到**你的录音（要给讲师听，请直接发 webm 给我）
   - 全平台目前只算一个用户：「local-student」
3. **不能收钱**：这一阶段只能算「内部 alpha」，向学生说明免费试用换反馈

### 如果只能本地试用，要怎么对用户说？

建议在 `/` 首页 hero 区下方加一段免责说明（直接抄走）：

> **当前版本为本地预览版（v0.x alpha）**
>
> - 录音和进度只保存在你当前的浏览器里，清除浏览数据 / 换设备 / 换浏览器都会丢
> - 讲师暂时无法直接查看你的录音，请把要点评的录音单独发给讲师
> - 本平台目前不支持多账号；同一台电脑多个学员请不要交叉使用
> - 我们正在接入用户系统、云端录音、讲师反馈，预计 2026-07 上线 v1

### 如果要上线给多个学生用，最小还需要补哪些功能？

按 must-have（绝对不能少）→ should-have（最好有）→ nice-to-have（可后补）排序：

**Must-have（缺一不可，对应 Step 1 + Step 2 + 部分 Step 3）**
1. 真音频（TTS 至少）
2. 用户系统（注册 / 登录 / 角色）
3. 录音上传到对象存储
4. DB 持久化（recordings / progress / assignments / feedback / favorites）
5. 讲师 feedback UI + API（评分 + 纠错 + 留言）
6. 数据隔离（每条查询带 userId）
7. 隐私 / 同意说明 + 软删除
8. HTTPS + cookie secure + sign URL 有效期短

**Should-have**
9. 邮件通知（讲师反馈 / 作业截止）
10. 班级和 enrollment 管理
11. 移动端响应式（最低限 lesson 页能在 iPad 上用）
12. 错误监控（Sentry）+ rate limit
13. 修日语生造（这条上线前必须做，但工作量在内容团队）

**Nice-to-have**
14. ASR（Whisper / Azure Speech）做学生录音转写 + 错音标红
15. 对比波形（学生 vs 标准）
16. 学生互评 / 学习小组
17. 课程进度可视化（GitHub 贡献日历风）
18. 公开试听课（不登录可听 lesson_01 前 5 句）

### 一句话送给 Ryan

> **当前这套代码的工程骨架是对的，问题不在 Next.js 怎么写，而在「内容质量 + 后端缺位 + 单用户假设」。Step 1 一周做完先把本地训练救活，Step 2 三周做完接后端，Step 3 上线前 1-2 周把合规/监控做完。三个月内能从「能演示」走到「能给一个班 10-20 人用」。**

---

## 附：本评审基于的实际证据清单

- 项目目录：`/Users/openclawxiaoer/sap-hub`
- AGENTS.md：已读
- _instructions.md：已读
- state/sap_jp_training_course.json：274 行已读，注意 `notes` 字段明确说音频是占位、录音只在浏览器
- package.json：Next.js 15.1.0 / React 19 / Tailwind 3.4 / lucide-react 0.468
- typecheck：`npm run typecheck` ✅ PASS
- build：本评审 sandbox 因外网受限拉 `@next/swc-linux-arm64-gnu` 失败；用户侧 `next dev` 和 `next start` log 显示已 ready
- dev-server log（`logs/screen-dev.log` 末段）：约 100 条 `/audio/placeholders/*.mp3 404`，0 条 200
- public/audio/placeholders/：目录存在但**空**
- data：lessons.json 2.8 MB / glossary 528 / phrases 576 / roleplays 48 / assignments 96 / review-terms 127
- 24 个组件文件 + 14 个 page 文件全部已读
- 1 个 convert 脚本（515 行）已读关键部分

> 本报告所有结论都基于以上证据。任何「我以为 / 我觉得」类的话都已避免；如有事实错误以代码为准。
