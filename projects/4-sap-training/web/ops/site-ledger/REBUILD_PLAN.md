# sap-jp.training 本地重建计划

- updated_by: codex
- updated_at: 2026-05-22T08:04:26+09:00
- source_snapshot: 2026-05-21T15:17:58.323Z
- source_branch: codex/sap-jp-content-audit-20260521
- source_commit: d3ba920609adeb2cb87b980ef74f5fc608af310a
- restore_safe: false

## 恢复原则

以 Git 作为内容和代码真相源。使用本 ledger 确认重建后必须存在的 branch、commit、路由地图、数据数量和文件。不要从 ledger 恢复 secret；请在本地 `.env.local` 或部署平台重新配置。

## 本地重建步骤

1. 恢复或 clone `/Users/openclawxiaoer/sap-hub`。
2. 切到记录的 branch 和 commit：

```bash
git checkout codex/sap-jp-content-audit-20260521
git checkout d3ba920609adeb2cb87b980ef74f5fc608af310a
```

3. 安装 web 依赖：

```bash
cd projects/4-sap-training/web
npm install
```

4. 在 `.env.local` 重新配置只属于本地的 secret。不要 commit 这个文件。
5. 如果源 Markdown 发生变化，重新生成内容：

```bash
npm run convert:content
```

6. 运行验证门：

```bash
npm run ledger:check
npm run typecheck
npm run lint
npm run build
```

7. 启动本地预览：

```bash
npm run dev
```

## 必需文件

- `package.json`
- `next.config.ts`
- `middleware.ts`
- `app/layout.tsx`
- `app/page.tsx`
- `app/login/page.tsx`
- `app/privacy/page.tsx`
- `data/_meta.json`
- `data/lessons.json`
- `data/phrases.json`
- `data/glossary.json`
- `data/roleplays.json`
- `data/assignments.json`
- `data/review-terms.json`
- `docs/SITE_ARCHITECTURE.md`
- `docs/SITE_CHANGE_LEDGER.md`
- `docs/STUDENT_GUIDE.md`
- `docs/TEACHER_GUIDE.md`
- `docs/ADMIN_OPS.md`

## 快照健康状态

- WARNING working_tree_dirty: 工作区有 15 个未提交路径；该 snapshot 只能用于观察，不能作为干净恢复锚点。

## 快照时的数据数量

```json
{
  "data/_meta.json": {
    "type": "object",
    "schemaVersion": "1.4.0",
    "generatedAt": "2026-05-21T14:56:39.888Z",
    "sourceCommit": "2ac18696e0cd89259a89e690f98d84bdb19bfeff",
    "stats": {
      "tracks": 1,
      "lessons": 24,
      "phrases": 480,
      "shadowing": 480,
      "roleplays": 48,
      "glossaryTerms": 583,
      "libraryItems": 6,
      "totalAssets": 240,
      "japaneseCoachEntries": 24
    },
    "audio": {
      "provider": "macos",
      "voice": "Kyoko",
      "generated": true,
      "generatedAt": "2026-05-21T14:49:07.933Z",
      "manifest": "/audio/audio-manifest.json",
      "counts": {
        "total": 1543,
        "phrase": 480,
        "shadowing": 480,
        "term": 583
      }
    },
    "backend": {
      "auth": "next-auth@5",
      "database": "neon postgres",
      "email": "resend",
      "storage": "cloudflare r2",
      "rateLimit": "upstash redis",
      "monitoring": "sentry",
      "tables": 20,
      "deployed": "vercel"
    },
    "compliance": {
      "privacyPage": "/privacy",
      "consentRequired": true,
      "softDeleteEnabled": true,
      "hardDeleteAfterDays": 30
    },
    "noteCount": 12
  },
  "data/assignments.json": {
    "type": "array",
    "count": 96,
    "sampleIds": [
      "lesson_01-assignment-vocabulary",
      "lesson_01-assignment-phrase",
      "lesson_01-assignment-recording",
      "lesson_01-assignment-consultant-output",
      "lesson_02-assignment-vocabulary"
    ]
  },
  "data/glossary.json": {
    "type": "array",
    "count": 583,
    "sampleIds": [
      "lesson_01-term-001",
      "lesson_01-term-002",
      "lesson_01-term-003",
      "lesson_01-term-004",
      "lesson_01-term-005"
    ]
  },
  "data/japanese-coach.json": {
    "type": "object",
    "updatedAt": "2026-05-21T22:56:32+09:00",
    "teachingPrinciples": 8,
    "forbiddenHabits": 6,
    "lessonEntries": 24
  },
  "data/lessons.json": {
    "type": "array",
    "count": 24,
    "sampleIds": ["lesson_01", "lesson_02", "lesson_03", "lesson_04", "lesson_05"]
  },
  "data/library.json": {
    "type": "array",
    "count": 6,
    "sampleIds": []
  },
  "data/phrases.json": {
    "type": "array",
    "count": 480,
    "sampleIds": [
      "lesson_01-phrase-001",
      "lesson_01-phrase-002",
      "lesson_01-phrase-003",
      "lesson_01-phrase-004",
      "lesson_01-phrase-005"
    ]
  },
  "data/review-terms.json": {
    "type": "array",
    "count": 127,
    "sampleIds": [
      "lesson_01-review-001",
      "lesson_01-review-002",
      "lesson_01-review-003",
      "lesson_01-review-004",
      "lesson_01-review-005"
    ]
  },
  "data/roleplays.json": {
    "type": "array",
    "count": 48,
    "sampleIds": [
      "lesson_01-roleplay-1",
      "lesson_01-roleplay-2",
      "lesson_02-roleplay-1",
      "lesson_02-roleplay-2",
      "lesson_03-roleplay-1"
    ]
  },
  "data/tracks.json": {
    "type": "array",
    "count": 1,
    "sampleIds": ["jp-foundation"]
  }
}
```
