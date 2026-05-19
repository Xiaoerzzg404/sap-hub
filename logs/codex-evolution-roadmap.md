# SAP 日语口语训练平台 · Codex 演进路线图（v1）

- 制定人：Claude（评审 + 架构规划）
- 制定日期：2026-05-19（Asia/Tokyo）
- 合并依据：
  - `logs/claude-code-speaking-platform-review.md`（评审报告）
  - 用户 2026-05-19 追加 4 项需求：
    1. 支持后续中级 / 高级 / 专题 / 加餐课程的扩展性
    2. 学生 + 讲师双向可用性
    3. 每课都把 11 大目录里的全部相关资料（设计稿 / 逐字稿 / 练习 / 术语 / 句型 / RolePlay / 讲师手册 / 学生讲义 / 待复核 / 质量审查 / 独立课程包）展示在网站上
    4. 网站根目录从 `/Users/openclawxiaoer/sap-hub` 迁到 `/Users/openclawxiaoer/sap-hub/projects/4-sap-training` 之下（sap-hub 是六大 Project 的统一仓库，4 号 Project 才是日语培训）

---

## 0. 路线图总览

| Phase | 名称 | 主要目标 | 预估工时 | 依赖 |
|---|---|---|---|---|
| **Phase 0** | 仓库迁移 + Baseline 锁定 | 网站根目录迁到 4 号 Project；锁版本、可回滚 | 0.5d | 无 |
| **Phase 1** | 课程数据模型扩展性 | 支持 track / level / lesson 三层；后续加中/高级/专题/加餐零成本 | 2-3d | Phase 0 |
| **Phase 2** | 每课「全资料」绑定 | 11 大目录 + v4 子目录的所有 md 按课聚合，进网站展示 | 3-4d | Phase 1 |
| **Phase 3** | 本地训练 MVP 救活 | 真音频 + 内容去生造 + Dashboard 修复 + 自评闭环 + 文本作业不丢 + 讲师占位 | 4-5d | Phase 1 |
| **Phase 4** | 学生 / 讲师 UX 重构 | 学生引导路径化；讲师专区改成「需后端，待接入」占位卡而非误导 | 3-4d | Phase 2/3 |
| **Phase 5** | Auth + DB + 服务端 | NextAuth + Postgres + Drizzle；多学生隔离；用户/班级/选课 | 1.5w | Phase 3 |
| **Phase 6** | 录音上传 + 讲师反馈 | S3/R2 直传 + recordings 表 + 讲师评分/纠错 API + UI | 1.5w | Phase 5 |
| **Phase 7** | 上线前合规 | RBAC / Rate Limit / Sentry / 备份 / 同意书 / 软删除 | 1w | Phase 6 |

**全程预估 8-12 周。**

**强约束**：
- 每个 Phase 完成必须能 `npm run typecheck && npm run build` 通过
- 每个 Phase 之间必须 git commit（commit message 格式：`codex: phase-X <短描述>`）
- 每个 Phase 完成后由 Claude 验收，验收不过不能进下一 Phase
- Codex 不许**自主决策**「跳过某 phase / 改路线图 / 修改硬约束」；遇阻先在 `projects/4-sap-training/inbox/` 写 `need-input-<date>.md`
- 「日语生造」「音频 404」「讲师看到自己录音」这三条 P0 在 Phase 3 必须修完，**不许带着 P0 进 Phase 4 以后**

---

## 1. 通用约定（所有 Phase 共用）

### 1.1 目录与命名

- **新仓库根**：`/Users/openclawxiaoer/sap-hub/projects/4-sap-training/web/`
- **包名**：`@sap-jp/speaking-platform`（package.json `name`）
- **课程内容源**：始终是 `/Users/openclawxiaoer/sap-hub/projects/4-sap-training/SAP日语培训/output/` 和 `…/sap_jp_training_course/output/`，**不要复制内容**，用 `convert-content.mjs` 转成 `web/data/**.json`
- **web/ 不进 sap-hub git lfs**：用 .gitignore 排除 `web/node_modules`、`web/.next`、`web/data/audio-cache`
- **绝不**再往 `/Users/openclawxiaoer/sap-hub/{app,components,lib,types,data,public,...}` 顶层写代码（迁完只留迁移残迹的备份目录）

### 1.2 Git 工作流

- 每 Phase 起手先 `git checkout -b codex/phase-X-<slug>`
- Phase 内部 commit 粒度尽量小（一条 metric 改完即 commit）
- Phase 完成 push + 在 `projects/4-sap-training/inbox/handoff-phase-X-<date>.md` 写交接给 Claude
- Claude 验收通过才合 main / 进 next phase

### 1.3 Codex 提示词使用方式

每个 Phase 下面有「**Codex 提示词（可直接粘贴）**」段落。Ryan 把整段贴给 Codex 当任务开头，Codex 按里面的步骤推进。

每个 Phase 还有「**Claude 验收方法**」，告诉我（Claude）下次会话怎么核对。验收只看产物，不看口头汇报。

### 1.4 不许做的事

- 不许在 Phase 3 之前接 Auth / DB / S3（Phase 5 之前所有数据存本地 IndexedDB/localStorage 即可）
- 不许在 Phase 3 之前删除任何已有 24 课内容数据
- 不许把课程文件直接复制进 `web/` —— 永远用 `convert-content.mjs` 衍生
- 不许在评审报告标出的 P0 修完前给学生发链接
- 不许编造任何日语句子（Phase 3 的「修生造」环节要严格按真实素材抽，抽不到就空）

---

## Phase 0 · 仓库迁移 + Baseline 锁定（0.5 天）

### 0.1 目标

- 把当前 `/Users/openclawxiaoer/sap-hub/{app,components,lib,types,data,public,scripts,next.config.ts,tsconfig.json,tailwind.config.ts,postcss.config.js,package.json,package-lock.json,next-env.d.ts,app/globals.css,...}` 全部搬到 `/Users/openclawxiaoer/sap-hub/projects/4-sap-training/web/`
- 在 sap-hub 根目录留一份 `WEB_MOVED.md` 注释新位置 + 旧目录 archive
- 在 `sap-hub/projects/4-sap-training/state/sap_jp_training_course.json` 加一条记录
- 锁定当前版本：在 `web/.baseline-v0.1.0/` 备份当前 24 课 data/*.json 防丢

### 0.2 工作内容（具体步骤）

1. 在 sap-hub 根 `git commit -am "codex: phase-0 freeze before web migration"`（避免漏迁）
2. `mkdir -p projects/4-sap-training/web`
3. 用 `git mv` 把这些路径迁过去（**用 git mv 不是 mv，保留历史**）：
   - `app/` → `projects/4-sap-training/web/app/`
   - `components/` → `projects/4-sap-training/web/components/`
   - `lib/` → `projects/4-sap-training/web/lib/`
   - `types/` → `projects/4-sap-training/web/types/`
   - `data/` → `projects/4-sap-training/web/data/`
   - `public/` → `projects/4-sap-training/web/public/`
   - `scripts/` → `projects/4-sap-training/web/scripts/`
   - `package.json`, `package-lock.json` → `projects/4-sap-training/web/`
   - `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `next-env.d.ts` → `projects/4-sap-training/web/`
4. 修改 `web/scripts/convert-content.mjs` 里的 `sourceRoot` 路径计算：
   - 旧：`path.join(root, "projects/4-sap-training/SAP日语培训/output")`
   - 新：`path.join(root, "../SAP日语培训/output")`（因为 cwd 现在是 `web/`）
   - 同步改 `dataDir`、`logsDir`
5. 修改 `web/package.json` `name`：`sap-jp-speaking-platform` → `@sap-jp/speaking-platform`
6. 在 `sap-hub/` 根加 `WEB_MOVED.md`：
   ```
   网站根目录已迁至 projects/4-sap-training/web/。
   开发：cd projects/4-sap-training/web && npm install && npm run dev
   ```
7. 在 `sap-hub/.gitignore` 加 `projects/4-sap-training/web/node_modules`、`.next`、`data/audio-cache/`
8. `cd web && rm -rf node_modules .next && npm install && npm run typecheck && npm run build` 全跑过
9. `cp -r data .baseline-v0.1.0/data-baseline`（备份当前 24 课转换产物）
10. 在 `projects/4-sap-training/state/sap_jp_training_course.json` `links` 追加 `../web/README.md`，更新 `updated_by` / `updated_at`，写入 `completed` 字段

### 0.3 验收标准（Claude 验收清单）

- [ ] `/Users/openclawxiaoer/sap-hub/app/` 不存在（已 git mv）
- [ ] `/Users/openclawxiaoer/sap-hub/projects/4-sap-training/web/app/page.tsx` 存在
- [ ] `cd web && npm run typecheck` ✅
- [ ] `cd web && npm run build` ✅
- [ ] `cd web && npm run dev` 起得来，访问 `http://127.0.0.1:3000` 看到首页
- [ ] `cd web && npm run convert:content` 跑得过，`data/lessons.json` 重新生成（数量 = 24）
- [ ] sap-hub 根 `WEB_MOVED.md` 存在
- [ ] `web/.baseline-v0.1.0/data-baseline/` 存在且非空
- [ ] git log 看得到 `git mv` 历史保留（`git log --follow web/app/page.tsx` 能跟到原路径）

### 0.4 Codex 提示词（可直接粘贴）

> ```
> 任务：执行《Codex 演进路线图 v1》Phase 0「仓库迁移 + Baseline 锁定」。
>
> 严格按以下步骤做，不许跳过、不许自由发挥；遇到任何冲突或不确定，在
> /Users/openclawxiaoer/sap-hub/projects/4-sap-training/inbox/need-input-phase0-{今日 YYYYMMDD}.md
> 写下问题并停止。
>
> 必读：
> 1. /Users/openclawxiaoer/sap-hub/AGENTS.md
> 2. /Users/openclawxiaoer/sap-hub/projects/4-sap-training/_instructions.md
> 3. /Users/openclawxiaoer/sap-hub/logs/claude-code-speaking-platform-review.md（评审报告）
> 4. /Users/openclawxiaoer/sap-hub/logs/codex-evolution-roadmap.md（本路线图）的 Phase 0 节
>
> 工作目录：/Users/openclawxiaoer/sap-hub
>
> 必做：
> A. git commit -am "codex: phase-0 freeze before web migration"
> B. mkdir -p projects/4-sap-training/web
> C. 用 `git mv` 把 app/ components/ lib/ types/ data/ public/ scripts/ package.json
>    package-lock.json next.config.ts tsconfig.json tailwind.config.ts
>    postcss.config.js next-env.d.ts 全部迁到 projects/4-sap-training/web/
> D. 改 web/scripts/convert-content.mjs 路径计算（详见路线图 0.2 step 4）
> E. 改 web/package.json name 为 "@sap-jp/speaking-platform"
> F. 写 sap-hub/WEB_MOVED.md
> G. 改 sap-hub/.gitignore
> H. cd web && rm -rf node_modules .next && npm install
> I. cd web && npm run typecheck （必须通过）
> J. cd web && npm run build （必须通过）
> K. cd web && npm run convert:content （重新生成 data/）
> L. cp -r web/data web/.baseline-v0.1.0/data-baseline
> M. 更新 projects/4-sap-training/state/sap_jp_training_course.json
>    （在 completed 追加一行；updated_by="codex"；updated_at=now JST）
> N. git add -A && git commit -m "codex: phase-0 migrate web to projects/4-sap-training/web"
> O. 在 projects/4-sap-training/inbox/handoff-phase-0-{YYYYMMDD}.md 写交接：
>    - 跑了什么、改了什么、typecheck/build 结果、有没有遗留问题
>
> 禁止：
> - 不要用 `mv` 或 `cp` 然后 rm，必须 `git mv`（保留历史）
> - 不要顺手修业务逻辑（这一 Phase 只搬路径）
> - 不要改 data/lessons.json 里的内容（只允许重新跑转换脚本生成）
> - 不要往 web/ 之外的 sap-hub 子目录写任何新文件（除 WEB_MOVED.md 和 inbox/）
>
> 完成后停下来等 Claude 验收。
> ```

### 0.5 Claude 验收方法

新会话用 `Read` + `Grep` 核对：

```
ls /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web/app/page.tsx
ls /Users/openclawxiaoer/sap-hub/app 2>&1  # 应该 No such file
cat /Users/openclawxiaoer/sap-hub/WEB_MOVED.md
ls /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web/.baseline-v0.1.0/data-baseline/
cd /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web && npm run typecheck
git -C /Users/openclawxiaoer/sap-hub log --oneline | head -5
```

通过 → 合 main → 开 Phase 1。

---

## Phase 1 · 课程数据模型扩展性（2-3 天）

### 1.1 目标

- 让数据模型从扁平 24 课升级为三层：**Track（培训线）→ Level（等级）→ Lesson（单课）**
- 把 Lesson 的"附件 / 资产"明确成一组结构化字段，11 大目录的资源都能挂上
- 为后续中级 / 高级 / 专题 / 加餐课程零成本扩展
- **本 Phase 只改类型 + 转换脚本 + 索引文件，不改 UI；UI 还能继续跑**

### 1.2 数据模型新定义

#### `types/track.ts`（新）

```ts
export type TrackId =
  | "jp-foundation"     // 当前 24 课（L0-L2 基础）
  | "jp-advanced"       // 未来：中高级
  | "jp-module-fico"    // 模块专题：FICO
  | "jp-module-mm"      // 未来：MM 专题
  | "jp-supplement";    // 加餐课

export type LevelId =
  | "L0-trial"
  | "L1-survival"
  | "L2-core"
  | "L3-module"
  | "L4-senior"
  | "supplement";

export type Track = {
  id: TrackId;
  title: string;          // "SAP 日本项目语言战斗力训练营 · 基础线"
  description: string;
  level: LevelId;
  durationLabel: string;  // "24 课 · 约 8 周"
  prerequisites?: string[];
  status: "active" | "draft" | "deprecated";
  order: number;
};
```

#### `types/lesson.ts`（扩字段，**保持向后兼容**）

```ts
export type LessonAsset = {
  kind:
    | "course-design"           // 01 课程设计稿
    | "classroom-transcript"    // 02 课堂逐字稿
    | "practice-homework"       // 03 练习与作业
    | "review-checklist"        // 09 待复核清单
    | "teacher-script-v4"       // v4 teacher_full_script_slide_by_slide
    | "student-ppt-v4"          // v4 student_ppt_outline_final
    | "classroom-workbook-v4"   // v4 classroom_practice
    | "case-pack-v4"            // v4 case_pack_appendix_all_modules
    | "quality-check-v4"        // v4 quality_check
    | "package-readme";         // 11_24课独立课程包/lesson_XX/00_README
  title: string;
  path: string;            // 源 md 在仓库里的绝对路径
  markdown: string;        // 文本内容（转换时读进 JSON）
  wordCount: number;
  visibility: "student" | "teacher" | "both";
};

export type Lesson = {
  // 已有字段保留
  id: string;
  title: string;
  order: number;
  // ✅ 新增
  trackId: TrackId;
  level: LevelId;
  assets: LessonAsset[];   // 一课所有 md
  // 其它已有：sapModules / projectPhase / japaneseSkillTargets / consultantSkillTargets
  //          finalOutputTask / summary / scenarioMap / terms / phrases /
  //          shadowingItems / substitutionDrills / rolePlays / microTrainings /
  //          consultantOutputs / assignments / reviewItems / transcriptMarkdown /
  //          courseDesignMarkdown
};
```

#### `data/tracks.json`（新，由脚本生成）

```json
[
  {
    "id": "jp-foundation",
    "title": "SAP 日本项目语言战斗力训练营 · 基础线",
    "description": "面向中国 SAP 顾问进入日本项目的基础语言训练，覆盖 L0-L2",
    "level": "L2-core",
    "durationLabel": "24 课 · 约 8 周",
    "status": "active",
    "order": 1
  }
]
```

未来加专题课只需在 tracks.json 加一行 + 给 Lesson.trackId 标对，UI 自动出现新 track。

### 1.3 工作内容

1. 新建 `web/types/track.ts`
2. 修 `web/types/lesson.ts`：加 `trackId / level / assets` 字段（其它不动）
3. 修 `web/scripts/convert-content.mjs`：
   - 给每课固定 `trackId: "jp-foundation"`, `level` 根据 lesson.order 推断（1-6 = L0/L1, 7-18 = L2, 19-24 = L3）
   - 加 `assets` 扫描：每课从 11 大目录抓对应 md，组装 LessonAsset[]
   - 输出 `data/tracks.json`
4. 修 `web/lib/content-loader.ts`：导出 `allTracks` / `getTrack(id)` / `getLessonsByTrack(trackId)`
5. **UI 不动**：但 sidebar 顶部加一行可见 "Track: SAP 日本项目语言战斗力训练营 · 基础线"（方便验收看到模型起效）
6. 把这次新增的 lesson 字段类型写进 `web/data/README.md`，标"未来加新 track 只需在 tracks.json 新增 + 跑 convert"

### 1.4 验收标准

- [ ] `web/data/tracks.json` 存在，里面至少 1 个 Track（id=jp-foundation）
- [ ] `web/data/lessons.json` 每条都有 `trackId` 和 `level` 字段
- [ ] `web/data/lessons.json[0].assets` 数组长度 ≥ 4（至少有 course-design / classroom-transcript / practice-homework / review-checklist 四类）
- [ ] `npm run typecheck` ✅
- [ ] `npm run build` ✅
- [ ] dev server 起来后页面没崩，UI 行为跟 Phase 0 完全一致（这一 Phase 仅扩字段）
- [ ] Sidebar 顶部出现 "Track: …" 行
- [ ] `data/lessons.json` 体积 vs 之前 ±20% 内（确认 assets 把 markdown 也吃进来了）

### 1.5 Codex 提示词（可直接粘贴）

> ```
> 任务：执行《Codex 演进路线图 v1》Phase 1「课程数据模型扩展性」。
>
> 必读：
> - 本路线图 Phase 1 节
> - web/types/lesson.ts 现有定义
> - web/scripts/convert-content.mjs 现有逻辑
>
> 工作目录：/Users/openclawxiaoer/sap-hub/projects/4-sap-training/web
>
> 必做：
> 1. 新建 types/track.ts（按路线图 1.2 节字段，TS strict 通过）
> 2. 修 types/lesson.ts，加 trackId / level / assets 三个新字段；不许动其它字段
> 3. 新建 data/README.md，写明三层模型 + 未来加 track 的步骤
> 4. 改 scripts/convert-content.mjs：
>    a. 顶部加 LEVEL_BY_ORDER 数组，给 24 课分 L0-L3
>    b. 加 buildLessonAssets(lessonId) 函数，从 ../SAP日语培训/output/
>       的 01/02/03/09/11 目录读出该课 md，组装 LessonAsset[]
>       （每个 asset 字段：kind/title/path/markdown/wordCount/visibility）
>    c. 加 buildTracks() 函数，输出 data/tracks.json（jp-foundation 一条）
>    d. 修 lesson 转换函数：trackId="jp-foundation"，
>       level=LEVEL_BY_ORDER[lesson.order-1]，assets=buildLessonAssets(...)
> 5. 改 lib/content-loader.ts：导出 allTracks / getTrack / getLessonsByTrack
> 6. 改 components/layout/Sidebar.tsx：顶部加一行 Track 显示（暂用静态文案）
> 7. npm run convert:content -> 检查 data/tracks.json、data/lessons.json
> 8. npm run typecheck && npm run build
> 9. git commit -m "codex: phase-1 track/level/asset model"
> 10. 在 inbox/handoff-phase-1-{YYYYMMDD}.md 写交接
>
> 禁止：
> - 不许改其它 UI 文件（除了 Sidebar 那一行）
> - 不许删 lessons.json 任何已有字段
> - 不许把 markdown 内容做"裁剪 / 整理 / 翻译"，原样读进 markdown 字段
> - 不许编造课程内容
>
> 完成后停下等验收。
> ```

### 1.6 Claude 验收方法

```
cat web/data/tracks.json | head
jq '.[0] | {id,title,order,trackId,level,assetsLen:(.assets|length),assetKinds:(.assets|map(.kind))}' web/data/lessons.json
```
关注：trackId / level / assets 字段是否到位；assets.kind 覆盖度。

---

## Phase 2 · 每课「全资料」绑定（3-4 天）

### 2.1 目标

把 Phase 1 准备好的 `Lesson.assets[]` 真正展示到 UI 上：
- 学生角度：能看到这节课的「学生讲义节选 / 练习 / 待复核 / 独立课程包入口」
- 讲师角度：能看到这节课的「教师逐字稿 / 课程设计稿 / case-pack / 质量审查」
- 跨课总表：术语表 / 句型库 / RolePlay 总集 / 讲师手册 / 学生讲义这些**全课程通用文档**给一个独立入口

### 2.2 工作内容

**1. 新增组件**

- `components/lesson/LessonAssetsTabs.tsx`：用 Tab 切换显示该课的全部 assets（按 visibility 过滤）；每个 tab 用 react-markdown 渲染（不要再 `stripMarkdown` 暴力降级）
- `components/lesson/LessonAssetBadge.tsx`：在 Lesson 详情页顶部显示"本课共 N 份资料"的徽章 chip 列表

**2. 装 react-markdown + rehype-raw + remark-gfm**（之前评审报告 P2-3 提到的）

```
npm install react-markdown rehype-raw remark-gfm
```

**3. Lesson 详情页加 LessonAssetsTabs**

- `app/courses/lessons/[lessonId]/page.tsx` 在「日语课堂逐字稿」section **之后**插入 `<LessonAssetsTabs lesson={lesson} viewerRole="student" />`
- 同时**删掉**已有的 `<ClassroomScriptViewer markdown={lesson.transcriptMarkdown} />`（被 assets 取代）

**4. 全课程总表入口**

- 新建 `app/library/page.tsx`：列「术语总表 / 句型总表 / RolePlay 合集 / 讲师手册 / 学生讲义 / 质量审查报告」6 个卡片（数据从 `data/library.json`，由转换脚本生成）
- 在 Sidebar 加 `/library` 入口

**5. 讲师专区扩展**

- `app/teacher/page.tsx` 加一个新 section「单课全资料浏览」：以下拉 + 切换 viewerRole=teacher 渲染 `<LessonAssetsTabs viewerRole="teacher" />`
- 讲师视角能看到 student 看不到的 quality-check / case-pack / teacher-script-v4

**6. 转换脚本扩展**

- 修 `scripts/convert-content.mjs`：新增 `buildLibrary()` → 输出 `data/library.json`，把 04/05/06/07/08/10 这 6 个跨课总表的 md 收进来
- `assets[].visibility` 规则：
  - 学生可见：student-ppt-v4 / classroom-workbook-v4 / practice-homework / package-readme
  - 仅讲师：teacher-script-v4 / case-pack-v4 / quality-check-v4
  - 双可见：course-design / classroom-transcript / review-checklist

### 2.3 验收标准

- [ ] `/courses/lessons/lesson_01` 页面能看到「该课资料」Tab，Tab 数 ≥ 5
- [ ] Tab 内容用 markdown 渲染（标题 / 列表 / 加粗都有视觉差）
- [ ] `/library` 路径有 6 个总表入口
- [ ] `/teacher` 页面有「单课全资料浏览」section，可下拉切换课次
- [ ] 学生页 vs 讲师页同一课的 Tab 数量不同（讲师多 case-pack/quality-check 等）
- [ ] `npm run typecheck && npm run build` ✅
- [ ] 任意一份 asset 的 markdown 长度对得上原 md 文件字数（±5%）

### 2.4 Codex 提示词（可直接粘贴）

> ```
> 任务：执行《Codex 演进路线图 v1》Phase 2「每课全资料绑定」。
>
> 必读：本路线图 Phase 2 节、web/types/lesson.ts（含 Phase 1 新字段）、
> /Users/openclawxiaoer/sap-hub/projects/4-sap-training/SAP日语培训/output/ 的 11 大目录
>
> 工作目录：/Users/openclawxiaoer/sap-hub/projects/4-sap-training/web
>
> 必做：
> 1. npm install react-markdown remark-gfm rehype-raw
> 2. 新建 components/lesson/LessonAssetsTabs.tsx
>    - props: { lesson, viewerRole: 'student' | 'teacher' }
>    - 按 viewerRole 过滤 assets（visibility 字段判断）
>    - Tab 切换每个 asset，正文用 react-markdown 渲染
> 3. 新建 components/lesson/LessonAssetBadge.tsx（chip 列表）
> 4. 改 app/courses/lessons/[lessonId]/page.tsx：
>    - 顶部 LessonHeader 下方加 <LessonAssetBadge assets={lesson.assets.filter(student)} />
>    - 删除 <ClassroomScriptViewer />
>    - 替换为 <LessonAssetsTabs lesson={lesson} viewerRole="student" />
> 5. 改 scripts/convert-content.mjs：加 buildLibrary() 输出 data/library.json
>    （读 04/05/06/07/08/10 六个跨课总表 md）
> 6. 新建 app/library/page.tsx：6 个卡片入口，点开渲染 markdown
> 7. 改 components/layout/Sidebar.tsx：加 /library 一行
> 8. 改 app/teacher/page.tsx：加「单课全资料浏览」section（下拉 + LessonAssetsTabs viewerRole=teacher）
> 9. 跑 convert:content / typecheck / build
> 10. git commit -m "codex: phase-2 lesson assets binding"
> 11. inbox/handoff-phase-2-{YYYYMMDD}.md
>
> 禁止：
> - 不许在 markdown 渲染里执行 <script>（rehype-raw 默认就不允许，别打开 dangerouslyAllowScript）
> - 不许把 markdown 内容截断（用 max-height + overflow-auto 让 UI 自己处理长度）
> - 不许给 student 暴露 teacher-only 的 asset（visibility 必须生效）
> - 不许编造课程内容
>
> 完成后停下等验收。
> ```

### 2.5 Claude 验收方法

逐个访问 `/courses/lessons/lesson_01`、`/courses/lessons/lesson_15`、`/library`、`/teacher`，截图给我看 Tab 数 + markdown 渲染是否到位；同时 Read `LessonAssetsTabs.tsx` 看 visibility 过滤逻辑。

---

## Phase 3 · 本地训练 MVP 救活（4-5 天）

### 3.1 目标

把评审报告的 P0/P1 关键项全部修完，做完之后**本地单人**能完成完整闭环（听 → 跟 → 录 → 回 → 评 → 复盘）：

- P0-1：真音频生成
- P0-2：内容去生造
- P0-3：讲师占位（不再误导）
- P0-6：文本作业不丢
- P1-1：Dashboard 不再永远 lesson_01
- P1-3：进度条真起来
- P1-5：波形真起来
- P1-6：blob URL 不写库
- P2-1：自评闭环
- P2-2：收藏 key 统一

### 3.2 工作内容

**1. 真音频（TTS 批量生成）**

- 新建 `scripts/generate-tts.mjs`：
  - 读 `data/phrases.json` / `data/lessons.json` 收集所有 `audioSrc`
  - 用 Azure Speech / OpenAI tts-1 / ttsmaker（Codex 先用 OpenAI tts-1 + voice="alloy" / 日语 alloy 还行，预算紧用 Azure neural ja-JP-NanamiNeural）
  - **凭据放 `web/.env.local`，不进 git**：`OPENAI_API_KEY=...` 或 `AZURE_SPEECH_KEY=...`
  - 输出 `web/public/audio/phrase/{phrase_id}.mp3` / `shadowing/{id}.mp3` / `term/{id}.mp3`
  - 已存在的文件跳过（增量）
  - 失败的写 `logs/tts-failures.md`
- 修 `convert-content.mjs` 的 `placeholderAudio()`：不再用 placeholders 子目录，按 type 分目录
- 跑一次完整生成

**2. 内容去生造**

- 修 `scripts/convert-content.mjs` 的 `buildPhrases / buildShadowing / buildRoleplays`：
  - 优先从 `…/sap_jp_training_course/output/lesson_XX_v4_teacher_focused/01_teacher_core/01_teacher_full_script_slide_by_slide.md` 抓**真句**
  - 用正则匹配 `^- 日语：(.+)$` / `^- 例：(.+)$` / `^（板書）(.+)$` 等真实日语行
  - 找不到真句的 lesson / item **直接跳过**（宁可少不要假）
  - 加一个 `data/content-source-report.md`：每课列出真句数 / 假句跳过数
- 跑完之后 Claude 抽检 lesson_05 / lesson_12 / lesson_20 各 10 句日语，0 句包含中文短语为合格

**3. Dashboard 修复（P1-1）**

- `app/dashboard/page.tsx` 把 `todayLesson` 包 `useMemo([progress])`
- 加 Loading 骨架屏，progress 未加载时不渲染默认 lesson_01

**4. 进度条真起来（P1-3）**

- `components/lesson/LessonHeader.tsx` 的 `ProgressBar` value 改成动态：
  ```ts
  const total = lesson.shadowingItems.length + lesson.microTrainings.length + lesson.consultantOutputs.length;
  const done = progress.completedShadowing.filter(id => id.startsWith(lesson.id)).length + ...;
  const value = Math.round((done / total) * 100);
  ```
- LessonHeader 需要变成 client component（加 "use client"，用 useEffect 读 progress）

**5. 波形真起来（P1-5）**

- `RecordingPanel.tsx` 在 `startRecording` 里同时 `audioContext.createMediaStreamSource(stream).connect(analyser)`
- 把 `analyserRef` 传给 `WaveformVisualizer`
- `WaveformVisualizer` 改成调 `analyser.getByteTimeDomainData()` 实时画

**6. blob URL 不写库（P1-6）**

- `RecordingPanel.tsx:saveCurrentRecording`：`audioUrl` 字段不再写 `URL.createObjectURL(activeBlob)`，改成存空字符串
- `recordingToObjectUrl(item)` 每次返回 `URL.createObjectURL(item.blob)`，调用方负责 revoke

**7. 自评闭环（P2-1）**

- `lib/progress-storage.ts` 加 `setSelfAssessment(recordingId: string, score: SelfAssessment)`
- `SelfAssessmentForm.tsx` 新增可选 prop `recordingId`，`onChange` 时调 `setSelfAssessment(recordingId, value)`
- `ShadowingCard / MicroTrainingTimer / ConsultantOutputRecorder / RolePlayRecorder / RecordingPanel.onSaved` 接 recording.id 传给 SelfAssessmentForm
- `app/review/page.tsx` 的「低分自评项目」逻辑保持不变（数据有了它就有了）

**8. 收藏 key 统一（P2-2）**

- 砍掉 `favoriteSentences`，统一用 `favoritePhrases`
- `ShadowingCard` 改 `toggleProgressList("favoritePhrases", item.id)` —— 但 shadowingItem.id 跟 phrase.id 是不同的命名空间，需要再拆一个 `favoriteShadowing` 字段，并在 `app/review/page.tsx` 三种 favorite 都展示

**9. 讲师占位（P0-3）**

- `components/teacher/StudentRecordingReview.tsx`：把 `<RecordingHistory />` 替换为：
  ```tsx
  <div className="panel border-amber-300 bg-amber-50 p-4">
    <h3 className="font-semibold text-amber-900">学生录音查看</h3>
    <p className="mt-2 text-sm text-amber-800">
      本功能需要后端支持（Phase 5/6 上线）。当前版本学生录音仅存储在学生自己的浏览器，
      讲师无法跨设备查看。请暂时联系学生直接发送录音文件。
    </p>
    <p className="mt-1 text-xs text-amber-700">预计上线：v1.0（详见 logs/codex-evolution-roadmap.md）</p>
  </div>
  ```

**10. 文本作业不丢（P0-6）**

- `app/assignments/page.tsx` 和 `components/lesson/LessonAssignment.tsx` 的 `<textarea>`：
  - 受控组件，`value={text}` `onChange={...}`
  - 用 `useEffect` 同步到 `localStorage`，key `assignment-text-${assignment.id}`
  - 加「保存」按钮显式确认（避免无意识丢）
  - 状态显示为 "未保存 / 已本地保存 / 已提交（待后端）"

**11. 数据契约头**

- `data/lessons.json` 头加一个 `__meta__` 注释字段（或单独 `data/_meta.json`）：版本号、生成时间、源 commit、tts-status

### 3.3 验收标准

- [ ] dev-server.log 全程 0 个 `/audio/.*404`
- [ ] 任意 3 节课随机抽 10 句日语，**0 句含中文短语**
- [ ] Dashboard 完成 lesson_01 标记 completed 后，「今日推荐」变 lesson_02
- [ ] Lesson 页 ProgressBar 录完 1 条 Shadowing 后 > 0%
- [ ] 录音时贴近 / 远离麦克风，波形高低有差
- [ ] 刷新 review 页，历史录音仍能播放（不再出现 blob URL 失效）
- [ ] 复盘中心「低分自评项目」录完一条 1-2 分录音后能显示
- [ ] 讲师专区 StudentRecordingReview 显示「待后端」黄色提示卡
- [ ] 作业页 textarea 输入后刷新仍在
- [ ] `npm run typecheck && npm run build` ✅
- [ ] `scripts/generate-tts.mjs` 增量跑（已存在的不重跑）

### 3.4 Codex 提示词（可直接粘贴）

> ```
> 任务：执行《Codex 演进路线图 v1》Phase 3「本地训练 MVP 救活」。
>
> 必读：评审报告的 Critical Findings 全部 P0/P1/P2 条目（在
> logs/claude-code-speaking-platform-review.md），以及本路线图 Phase 3 节
>
> 工作目录：/Users/openclawxiaoer/sap-hub/projects/4-sap-training/web
>
> 务必按子任务 1-11 顺序做（不许并发，每个子任务一个 commit）：
>
> 子任务 1：真音频 TTS
>   - 新建 scripts/generate-tts.mjs（详见路线图 3.2 节）
>   - 凭据 .env.local 不进 git；.gitignore 已含
>   - 默认 Azure Speech ja-JP-NanamiNeural；若无凭据，先生成 silent.mp3 占位 + 写 tts-failures.md
>   - 跑一次完整生成
>   - 改 convert-content.mjs placeholderAudio() 路径
>   - 重跑 convert:content
>   - commit
>
> 子任务 2：去生造
>   - 改 convert-content.mjs 三个 build 函数
>   - 加 data/content-source-report.md 统计
>   - 跑一次完整 convert，让 Claude 验收前先自己抽 10 句确认无中文短语
>   - commit
>
> 子任务 3-10：按路线图 3.2 节顺序逐项实施
>
> 子任务 11：写 data/_meta.json（版本/时间/源 commit/tts-status）
>
> 完成后跑：
>   npm run typecheck
>   npm run build
>   npm run dev
>   逐个手测：/dashboard /courses/lessons/lesson_01 /speaking/shadowing
>           /assignments /review /teacher
>   把测试结果写进 inbox/handoff-phase-3-{YYYYMMDD}.md
>
> 禁止：
> - 不许在 Phase 3 接 Auth / DB / S3（保留 Phase 5/6）
> - 不许编造任何日语句子（这是 N 节真实性硬底线，违反整篇 abort）
> - 不许把 TTS 输出的 mp3 commit 进 git（用 .gitignore 排除 public/audio/）
> - 不许跳过验收清单的任何一项
>
> 完成后停下等验收。
> ```

### 3.5 Claude 验收方法

新会话用 `mcp__workspace__bash`：
```
ls web/public/audio/phrase | wc -l   # 应有数百
grep -E '[一-鿿]{2,}' web/data/lessons.json | head -20  # 抽中文短语，应基本只是术语
node -e 'const l=require("./web/data/lessons.json")[0];console.log(l.shadowingItems.slice(0,5).map(s=>s.japanese))'  # 抽样
```
跑 dev → screenshot → 看 Dashboard 完成态 / 波形 / 文本作业回填。

---

## Phase 4 · 学生 / 讲师 UX 重构（3-4 天）

### 4.1 目标

学生端：把 8 大 section 铺平的 Lesson 页改成「Stepper 引导式」；Dashboard 给出今日 5-step 路径；首页加「试听 / 30 秒看看」轻入口。

讲师端：明确「本版本是教学内容站，讲师专区是数据预览，不是真后台」的边界；为 Phase 5/6 做 UI 占位。

### 4.2 工作内容

**1. Lesson Stepper**

- 新增 `components/lesson/LessonStepper.tsx`：5 步骤：
  1. 术语预热（5 min）
  2. 句型听读（10 min）
  3. Shadowing（10 min）
  4. 30 秒输出（10 min）
  5. 60 秒顾问输出 + Role Play + 作业（15 min）
- 改 lesson 详情页：默认显示当前 step 内容，可以「下一步 / 上一步」切换；进度存 `progress.lessonStep[lessonId]`

**2. Dashboard 路径化**

- 改 `app/dashboard/page.tsx`：
  - 顶部「今日推荐」加一个 5-step mini timeline（基于学生当前 lesson 的 step）
  - 加「最近 7 天活跃度」（基于 progress.recentStudyAt 历史 — 需要把 recentStudyAt 改成事件 log）

**3. 首页轻入口**

- `app/page.tsx` hero 区下方加 3 张卡片：
  - 「30 秒试听 lesson_01」（直接播 lesson_01 第一句 + 不需要登录）
  - 「我是讲师」（去 /teacher）
  - 「24 课大纲」（去 /courses）
- 在 hero 区下面**加免责说明**（按评审报告 10.2 节文案）

**4. 讲师专区改造**

- `app/teacher/page.tsx` 顶部加 banner：
  ```
  当前是教学内容预览站（v0.x alpha）。真讲师后台需要后端，预计 v1.0 上线。
  本页面可用于：① 浏览课程全部内容；② 查看待复核术语；③ 抽样课程质量。
  本页面不可用于：① 看学生录音作业；② 给学生打分；③ 给学生反馈。
  ```
- 把「学生录音作业占位列表」改名为「[Phase 5/6 上线] 学生录音作业」
- 加新 section：**单课全资料浏览**（Phase 2 已有，但调到讲师专区主位）

**5. 移动端**

- Sidebar 改成抽屉（点 Header 上的 menu icon 弹出）
- Lesson Stepper 在 sm 屏幕一屏只显示当前 step + 上下切换
- AudioPlayer 控件在 sm 屏自适应布局

**6. i18n 区分**

- 给所有日语文本 `<span lang="ja">…</span>` 包一层
- 在 `globals.css` 加：`[lang="ja"] { font-family: "Hiragino Sans", "Yu Gothic", "Meiryo", sans-serif; }`

### 4.3 验收标准

- [ ] Lesson 页默认只显示当前 step；其它 step 折叠
- [ ] Dashboard 5-step timeline 能看出今天的进度
- [ ] 首页有 3 张轻入口卡片
- [ ] 首页 hero 区下方有黄色免责声明
- [ ] 讲师专区 banner 明显
- [ ] 移动端宽度 375px 下 Sidebar 抽屉能打开
- [ ] Chrome devtools 选中任意日语句子，computed font 是 Hiragino / Yu Gothic 等日语字体而不是 PingFang/STSong
- [ ] `npm run typecheck && npm run build` ✅

### 4.4 Codex 提示词（可直接粘贴）

> ```
> 任务：执行《Codex 演进路线图 v1》Phase 4「学生/讲师 UX 重构」。
>
> 必读：路线图 Phase 4 节、评审报告第 4/5 节（学生/讲师 workflow）
>
> 工作目录：/Users/openclawxiaoer/sap-hub/projects/4-sap-training/web
>
> 必做：
> 1. 新建 components/lesson/LessonStepper.tsx（5 步）
> 2. 改 app/courses/lessons/[lessonId]/page.tsx：用 Stepper 包裹 8 大 section
>    - 当前 step 来自 useState，初始读 progress.lessonStep[lessonId] ?? 0
>    - 点「下一步」时 progress.lessonStep[lessonId]++，写 localStorage
> 3. 改 lib/progress-storage.ts：加 lessonStep / lastActiveAt 字段
> 4. 改 app/dashboard/page.tsx：加 5-step timeline
> 5. 改 app/page.tsx：加 3 张轻入口卡片 + 免责说明
> 6. 改 app/teacher/page.tsx：加 banner + 占位卡 + Phase 2 的单课全资料浏览主位
> 7. 改 components/layout/Sidebar.tsx + Header.tsx：抽屉
>    - 新增 components/layout/MobileNav.tsx
> 8. 改 globals.css：[lang="ja"] 字体规则
> 9. 把所有日语字面量 / 数据渲染加 lang="ja"
>    - 用 grep 找出所有 .japanese 字段渲染的位置，加 lang="ja"
> 10. typecheck / build / 手测 PC + 移动模拟 / commit / handoff
>
> 禁止：
> - 不许动数据模型（types/lesson.ts 不再改）
> - 不许接后端
> - 不许引入 UI 库（shadcn/Radix 之类）—— Tailwind 自己写
>
> 完成后停下等验收。
> ```

### 4.5 Claude 验收方法

跑 dev → 用 Chrome devtools 切 iPhone 12 mini 尺寸截图 → 看 Sidebar 抽屉 / Stepper / 字体；Read MobileNav / LessonStepper 确认实现。

---

## Phase 5 · Auth + DB + 服务端基座（1.5 周）

### 5.1 目标

引入 Auth.js v5 + Postgres + Drizzle，把进度 / 自评 / 文本作业从 localStorage 迁到服务端；建立 users / classes / enrollments / lessons / phrases / glossary_terms / assignments / assignment_submissions / favorites / progress_events 表（详见评审报告第 8 节）。

录音仍存 IndexedDB（Phase 6 才上传 S3），但 metadata 同步落 DB。

### 5.2 工作内容（高层）

1. 装依赖：`@auth/core @auth/drizzle-adapter drizzle-orm drizzle-kit pg`
2. 建 `lib/db/schema.ts`（按评审报告 8 节）
3. 建 `lib/db/index.ts`（drizzle client）
4. `drizzle.config.ts` + 第一次 migration
5. 选 Neon free tier，凭据放 `.env.local`：`DATABASE_URL=...`
6. 建 `app/api/auth/[...nextauth]/route.ts`：邮箱 magic link（Resend）
7. 建 `middleware.ts`：守 `/teacher`、`/api/*`
8. 建 `app/(auth)/login/page.tsx`、`app/(auth)/verify/page.tsx`
9. 把 progress / favorites / self-assessment 从 localStorage 改成 `POST /api/progress/events`
10. 把 lesson / glossary / phrases 数据从 `data/*.json` 迁进 DB（写一次性 seed 脚本 `scripts/seed-db.mjs`）
11. `content-loader.ts` 改成 `getLessonFromDb(id)`（保留 fallback 读 JSON 用于本地开发）
12. 建 `lib/auth/guards.ts`：`requireUser()` / `requireRole(['teacher'])`
13. 角色：注册默认 student；teacher / admin 由 admin 手动 promote（先没 admin UI，直接 SQL）

### 5.3 验收标准

- [ ] `npm run dev` 起来后未登录访问 `/teacher` 跳 `/login`
- [ ] 邮箱注册 → 收 magic link → 点链接登录 → 进 `/dashboard` 看到自己的进度
- [ ] 学生 A 登录、做 1 条 Shadowing → 学生 B 在另一浏览器登录、看不到 A 的记录
- [ ] DB 里 `progress_events` 有事件行
- [ ] `users.role='teacher'` 才能进 `/teacher`
- [ ] 录音仍可保存（IndexedDB），但 `recordings` 表里有对应 metadata 行（无 storage_key，因为还没上传）
- [ ] `npm run typecheck && npm run build && npm run drizzle:migrate` 都过

### 5.4 Codex 提示词

> ```
> 任务：执行《Codex 演进路线图 v1》Phase 5「Auth + DB + 服务端基座」。
>
> 必读：路线图 Phase 5 节、评审报告第 7/8 节
>
> 前置：让 Ryan 在 Neon (https://neon.tech) 开一个 free tier 项目，把
> DATABASE_URL 给 Codex；让 Ryan 在 Resend (https://resend.com) 开账号
> 给 RESEND_API_KEY。Codex 不要自己注册第三方账号。
>
> 工作目录：/Users/openclawxiaoer/sap-hub/projects/4-sap-training/web
>
> 必做：
> 1. npm install @auth/core @auth/drizzle-adapter drizzle-orm drizzle-kit pg
>    （+ next-auth@beta 或 Auth.js v5）
> 2. 写 lib/db/schema.ts —— 评审报告 8 节那 10 张表
> 3. drizzle.config.ts + npm run drizzle:generate + drizzle:migrate
> 4. lib/auth/options.ts（NextAuth 配置，邮箱 magic link via Resend）
> 5. app/api/auth/[...nextauth]/route.ts
> 6. middleware.ts（守 /teacher /api/*）
> 7. app/(auth)/login/page.tsx + verify/page.tsx
> 8. scripts/seed-db.mjs：读 data/*.json 灌 DB（幂等：每次先 truncate 然后插）
> 9. 改 lib/content-loader.ts：getLessonFromDb，保留 JSON fallback
> 10. 改 progress-storage.ts：从 localStorage 改 fetch /api/progress/events
> 11. app/api/progress/events/route.ts（POST 追加事件 / GET 拉时间线）
> 12. app/api/recordings/route.ts（先只接 metadata，不接 storage）
> 13. typecheck / build / dev 手测 / commit / handoff
>
> 禁止：
> - 不许把 DATABASE_URL / RESEND_API_KEY 写进任何 git 跟踪文件
> - 不许在 magic link 验证中使用 GET 无校验的 token（必须用 NextAuth 标准 callback）
> - 不许擅自 promote 用户 role 到 teacher / admin（保留 SQL 通道）
> - 不许加 OAuth / 微信登录 / GitHub 登录（先邮箱 magic link 单一登录路径，降低 alpha 期复杂度）
>
> 完成后停下等验收。
> ```

### 5.5 Claude 验收方法

让 Ryan 用 2 个邮箱（自己 + 一个测试号）走完注册-登录-进度独立测试；我看 schema.ts + middleware.ts + 1-2 个 API route 代码。

---

## Phase 6 · 录音上传 + 讲师反馈（1.5 周）

### 6.1 目标

录音走 R2 / S3 直传；讲师专区改成真后台（按学生 / 课次 / 状态筛选 + 评分 + 纠错 + 留言）。

### 6.2 工作内容（高层）

1. 装：`@aws-sdk/client-s3 @aws-sdk/s3-request-presigner`
2. 选 Cloudflare R2（私有 bucket）；Ryan 给 R2 凭据
3. 建 `lib/storage/r2.ts`：`getPresignedPutUrl / getPresignedGetUrl`
4. `app/api/recordings/sign/route.ts`：返回 presigned PUT URL（5 min）
5. 改 `RecordingPanel.saveCurrentRecording`：
   - 步骤：① POST sign 拿 URL → ② client PUT blob → ③ POST `/api/recordings` 落 metadata
   - IndexedDB 保留为 offline fallback（网络断时存本地、恢复时补传）
6. `app/api/recordings/route.ts` GET：返回当前学生的录音列表（带 presigned GET URL）
7. `app/api/teacher/recordings/route.ts` GET：讲师专用，可按 studentId / lessonId / status / hasFeedback 筛
8. `app/api/recordings/[id]/feedback/route.ts` PATCH：讲师评分 + 纠错 + 留言；触发邮件给学生
9. UI：
   - `app/teacher/recordings/page.tsx`（学生 + 课次 + 状态筛选）
   - `app/teacher/recordings/[id]/page.tsx`（详情 + 评分 + 纠错 + 留言表单 + 讲师示范录音上传）
   - 学生侧 lesson 页 / review 页显示讲师 feedback
10. 邮件通知（Resend）

### 6.3 验收标准

- [ ] 学生录音保存后 R2 bucket 看到 `audio/{userId}/{lessonId}/{recordingId}.webm`
- [ ] 讲师 `/teacher/recordings` 看到所有学生录音（不是讲师自己的）
- [ ] 讲师筛 status=pending-review 能筛出
- [ ] 讲师评分后学生 review 页看到红字反馈
- [ ] 邮件通知到达
- [ ] presigned URL 5/10 min 过期后无法重放
- [ ] 学生 A 永远 GET 不到学生 B 的 recordings（API 层拒绝）

### 6.4 Codex 提示词

> ```
> 任务：执行《Codex 演进路线图 v1》Phase 6「录音上传 + 讲师反馈」。
>
> 必读：路线图 Phase 6、评审报告 6/7/8 节
>
> 前置：让 Ryan 开 Cloudflare R2，给 R2_ACCOUNT_ID/R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY/
> R2_BUCKET_NAME。
>
> 工作目录：/Users/openclawxiaoer/sap-hub/projects/4-sap-training/web
>
> 必做：按 6.2 节 10 步顺序，每步一个 commit
>
> 安全硬底线：
> - 所有 API 必须用 lib/auth/guards.ts 守
> - GET recordings 必须 where student_id = $session.userId（讲师除外）
> - 讲师 GET 必须确认 enrollment 关系（讲师只能看自己班的学生）
> - presigned URL 不超过 10 分钟
> - bucket policy 必须私有，不允许 anonymous read
> - 单录音 ≤ 10 MB；服务端校验文件大小
>
> 禁止：
> - 不许把 R2 凭据写进 client bundle（只在 server 用）
> - 不许在 audioUrl 字段返回原始 R2 URL（必须 presigned）
> - 不许跳过任何「学生隔离」校验
>
> 完成后停下等验收。
> ```

### 6.5 Claude 验收方法

我会要 Ryan 用 2 学生 + 1 讲师跑端到端：A 录 B 不能看；讲师评分 A 收到。同时 Read 几个 API route 确认 where 子句带 userId。

---

## Phase 7 · 上线前合规、监控、备份（1 周）

### 7.1 目标

把网站从「能多人用」推到「敢给学生付费用」。

### 7.2 工作内容

1. RBAC 守卫齐全（所有路由 + API）
2. Rate limit（Upstash 或 next-rate-limit）：注册 / 上传 / 反馈 各自配额
3. Sentry：前端 + API 都接
4. 隐私同意：注册时勾选 + `/privacy` 页 + 录音保存按钮上方提示
5. 软删除：recordings.deleted_at；定时任务 30 天硬删
6. DB 备份：Neon 自动 snapshot + 每周导出 dump 到 R2
7. R2 versioning + lifecycle（90 天归档）
8. CI/CD：GitHub Actions PR 跑 typecheck/lint/build
9. lint + prettier + husky + lint-staged
10. ARIA / 移动端最低线
11. Sentry release 关联 commit
12. 容量监控：录音总量 / DB 行数 dashboard
13. Onboarding 文档：`web/docs/STUDENT_GUIDE.md` + `web/docs/TEACHER_GUIDE.md` + `web/docs/ADMIN_OPS.md`

### 7.3 验收标准

- [ ] PR 触发 CI 跑过
- [ ] 注册流程没勾同意书过不去
- [ ] 录音页面有显眼隐私说明
- [ ] 试 30 次注册同邮箱被 rate limit
- [ ] Sentry 收到一条 test error
- [ ] DB 每天有 snapshot 时间戳
- [ ] R2 有 versioning 标志
- [ ] 3 份 docs 写完且 100 行以内能让新用户跑起来

### 7.4 Codex 提示词

> ```
> 任务：执行《Codex 演进路线图 v1》Phase 7「上线前合规」。
> 内容：按 7.2 节 13 项逐条做，每项一个 commit。
> 工作目录：projects/4-sap-training/web
>
> 禁止：
> - 不许跳任何一项「敢给学生付费用」的硬底线
> - 不许把 SENTRY_DSN 等凭据写进 client bundle（用 env 注入）
>
> 完成后写 inbox/handoff-phase-7-{YYYYMMDD}.md 申请上线评审。
> ```

### 7.5 Claude 验收

我会逐项核 13 项；docs/STUDENT_GUIDE.md 我会以「第一次用网站的学生」视角走一遍。

---

## 8. 路线图防回退机制

| 风险 | 对策 |
|---|---|
| Codex 在 Phase 3 跳过 P0-2「修生造」想赶进度 | Claude 验收时**逐课 grep**中文短语，任意 1 句不达标整 Phase 退回 |
| Codex 在 Phase 5 加了 OAuth 增加复杂度 | Codex 提示词明令禁止；Claude 验收时 Read NextAuth 配置 |
| Codex 直接复制内容到 web/data 而不是脚本生成 | 路线图通用约定第 4 条；Claude 验收时 `git log --follow web/data/lessons.json` 看是否仅来自脚本 |
| Codex 改路线图 | 不允许；Codex 提示词里明令；Ryan 若想调整路线，让 Claude 改 |
| Phase 之间 schema 不兼容 | 每个 Phase 跑完 commit 一个 .baseline，下一 Phase 起手先 `cp -r data .baseline-X`（验收脚本预留对比） |

---

## 9. 上线节奏建议

- **alpha**（Phase 0-3 完成后）：Ryan 自己 + 1-2 个测试学生在 Ryan 监督下试用，**只在本机 + Chrome**
- **beta**（Phase 4-5 完成后）：5-10 个测试学生远程登录，仅基础线 24 课
- **v1.0**（Phase 6-7 完成后）：开第一个班，付费可以走，但建议先免费一期收 NPS
- **v2.0**（路线图外）：加中级 / 高级 / 专题 / 加餐 track，按 Phase 1 模型零成本扩展

---

## 10. 一句话给 Ryan

> 这套路线图把"修旧网站 + 满足新需求 + 上线生产"合并成 8-12 周路径。每个 Phase 给了 Codex 可粘贴的提示词、给我可验收的清单。**先跑 Phase 0（半天，把仓库迁完），让我验收一次，再让 Codex 接 Phase 1。**不许跳，不许并发，不许 Codex 自由发挥。

---

## 附：本路线图涉及的源文件清单

- 现有评审：`logs/claude-code-speaking-platform-review.md`
- 现有 state：`projects/4-sap-training/state/sap_jp_training_course.json`
- 现有内容根：`projects/4-sap-training/SAP日语培训/output/`（11 大目录）
- 现有内容根：`projects/4-sap-training/sap_jp_training_course/output/lesson_XX_v4_teacher_focused/`（6 子目录）
- AGENTS 规则：`AGENTS.md`、`projects/4-sap-training/_instructions.md`
- 用户全局规则：`CLAUDE.md`（FICO 视角 / 中文回复 / 不杜撰）

> 任何与本路线图冲突的"快速做法"，以路线图为准。路线图本身的修改权在 Ryan，执行权在 Codex，验收权在 Claude。
