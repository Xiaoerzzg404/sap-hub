# sap-jp.training Local Rebuild Plan

- updated_by: site-ledger
- updated_at: 2026-05-21T23:58:20+09:00
- source_snapshot: 2026-05-21T14:58:19.480Z
- source_branch: codex/sap-jp-content-audit-20260521
- source_commit: 2ac18696e0cd89259a89e690f98d84bdb19bfeff
- restore_safe: false

## Recovery Principle

Use Git as the content and code source of truth. Use this ledger to identify the exact branch, commit, route map, data counts, and files that must exist after rebuild. Do not restore secrets from the ledger; recreate them in local `.env.local` or the deployment provider.

## Local Rebuild Steps

1. Restore or clone `/Users/openclawxiaoer/sap-hub`.
2. Check out the recorded branch and commit:

```bash
git checkout codex/sap-jp-content-audit-20260521
git checkout 2ac18696e0cd89259a89e690f98d84bdb19bfeff
```

3. Install the web dependencies:

```bash
cd projects/4-sap-training/web
npm install
```

4. Recreate local-only secrets in `.env.local`. Do not commit this file.
5. Rebuild generated content if source Markdown changed:

```bash
npm run convert:content
```

6. Run the verification gate:

```bash
npm run ledger:check
npm run typecheck
npm run lint
npm run build
```

7. Start local review:

```bash
npm run dev
```

## Required Files

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

## Snapshot Health

- WARNING working_tree_dirty: Working tree has 32 uncommitted path(s); snapshot is observational, not a clean restore anchor.

## Data Counts At Snapshot Time

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
