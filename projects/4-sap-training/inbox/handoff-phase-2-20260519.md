# Phase 2 Handoff - 2026-05-19

## Scope

Executed Codex Phase 2: bind each lesson's `Lesson.assets[]` into the student lesson UI, teacher UI, and a cross-course `/library` page.

Branch: `codex/phase-2-asset-binding`
Base: `5e2833a docs: phase-2 prompt and codex need-input record`

## Commits

- `540cc0d build(deps): add react-markdown remark-gfm rehype-raw for Phase 2`
- `f6f7f25 feat(lesson): bind assets[] tabs and badge to student lesson page`
- `f38fc39 feat(library): export 6 cross-course master docs to data/library.json`
- `533b032 feat(library): add cross-course library page and sidebar entry`
- `3fd1179 feat(teacher): add per-lesson assets browser with teacher visibility`
- `HEAD chore(state): record Phase 2 asset binding completion` (state + handoff record)

## What Changed

- Added structured Markdown rendering with `react-markdown`, `remark-gfm`, and `rehype-raw`.
- Added reusable lesson asset UI:
  - `components/lesson/MarkdownView.tsx`
  - `components/lesson/LessonAssetsTabs.tsx`
  - `components/lesson/LessonAssetBadge.tsx`
- Replaced the old student lesson transcript-only display with `LessonAssetsTabs viewerRole="student"`.
- Added a top lesson chip showing the 7 student-visible asset kinds.
- Added `data/library.json` generation from cross-course master documents.
- Added `/library` and sidebar entry `总表 / 手册`.
- Added teacher-side per-lesson asset browser with `viewerRole="teacher"` and 10 asset kinds.
- Updated `projects/4-sap-training/state/sap_jp_training_course.json`.

## Data Check

Current generated data:

- `libraryItems`: 6
- `libraryKinds`:
  - `glossary-master`
  - `phrasebook-master`
  - `roleplay-master`
  - `teacher-handbook`
  - `student-handbook`
  - `quality-report`
- Lesson 01 student-visible assets: 7
- Lesson 01 teacher-visible assets: 10
- `data/lessons.json`: 6,952,404 bytes
- `data/library.json`: 188,163 bytes

## Verification

Commands run from `projects/4-sap-training/web`:

- `npm install react-markdown remark-gfm rehype-raw`
- `npm run typecheck` - passed
- `npm run convert:content` - passed, regenerated data and exported 6 library docs
- `npm run build` - passed, generated 44 static pages

Build output notes:

- `/courses/lessons/[lessonId]`: 211 kB first load JS
- `/teacher`: 204 kB first load JS
- `/library`: 1.2 MB first load JS
- Shared first load JS: 102 kB

Browser smoke checks against `http://127.0.0.1:3000`:

- `/courses/lessons/lesson_01`
  - Student view showed `学生视角 · 共 7 份`
  - All 7 expected tabs were present
  - Clicking `练习与作业` activated that tab
  - Old `课堂逐字稿速览` text was absent
  - Console error logs: none
- `/teacher`
  - Teacher asset browser showed `单课全资料浏览（讲师视角）`
  - Lesson selector contained 24 options
  - Teacher view showed `讲师视角 · 共 10 份`
  - Clicking `案例包 v4` activated that tab
  - Old transcript-only preview was absent
  - Console error logs: none
- `/library`
  - Page rendered 6 cross-course master documents
  - Markdown headings/tables/lists rendered structurally
  - Console error logs: none

The dev server was stopped after smoke checks; no process is listening on port 3000.

## Residual Notes

- Dev server logs still show 404s for placeholder audio paths such as `/audio/placeholders/lesson_01_phrase_001.mp3`. This is pre-existing placeholder-audio behavior and was not changed in Phase 2.
- `/library` first load JS is high because the page imports full cross-course markdown from local JSON. This is acceptable for Phase 2 but should be revisited in the planned loader/data-splitting phase.
- `npm install` reported 2 moderate audit issues. They were not fixed because dependency audit remediation was outside Phase 2 scope.

## Next

Stop here and wait for Claude validation. If accepted, proceed to Phase 3: restore local training MVP with real audio assets, generated-content cleanup, dashboard fixes, self-assessment persistence, text homework persistence, and clearer teacher placeholders.
