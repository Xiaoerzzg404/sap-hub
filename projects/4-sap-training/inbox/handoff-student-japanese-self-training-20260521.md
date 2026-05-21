# Handoff · Student Japanese Self-Training Upgrade · 2026-05-21

- updated_by: codex
- updated_at: 2026-05-21T23:08:03+09:00
- branch: codex/sap-jp-content-audit-20260521
- scope: student-facing Japanese coach layer and self-training workspace

## What Changed

- Added a student-facing Japanese Coach panel to every lesson detail page:
  - `projects/4-sap-training/web/components/lesson/JapaneseCoachPanel.tsx`
  - wired from `projects/4-sap-training/web/app/courses/lessons/[lessonId]/page.tsx`
- Added `/speaking/self-training`:
  - lesson selector
  - 句型拆解
  - NG 改写
  - 对话补全
  - 60 秒输出
  - recording hooks through existing `RecordingPanel`
  - per-lesson local notes for weak expressions, teacher reminders, and module replacement sentences
- Updated entry points:
  - header CTA now points to self-training
  - sidebar/mobile nav includes `日语自训`
  - `/speaking` hub includes `日语自训工作台`
- Reused the current structured `web/data/japanese-coach.json` teacher/student coach data instead of inventing a parallel source.
- Optimized `/speaking/self-training` to load lesson metadata with `getAllLessons()` instead of full lesson content, avoiding a huge client payload.

## Content Gaps Addressed

- The lesson pages previously exposed terms/phrases/recording flows, but did not clearly explain why a Japanese sentence works in a real SAP project meeting.
- Students had recording tools, but no compact drill surface for NG-to-OK rewriting, dialogue completion, and 60-second consultant output.
- Students had no local place inside the training flow to retain weak Japanese expressions and rewrite attempts by lesson.
- The coach data now appears in student flow, not only the teacher preparation flow.

## Verification

- `npm run typecheck`: PASS.
- `npm run lint`: PASS.
- `CI=true DATABASE_URL=postgres://mock:mock@localhost:5432/mock AUTH_SECRET=local-build-secret NEXTAUTH_URL=http://localhost:3000 NEXT_PUBLIC_SENTRY_DSN= npm run build`: PASS after clearing stale `.next`.
- Browser smoke on `http://127.0.0.1:3211`:
  - public header shows `开始自训`
  - sidebar shows `日语自训`
  - logged-out `/speaking/self-training` redirects to `/login?callbackUrl=%2Fspeaking%2Fself-training`
- Cookie-scoped local render smoke:
  - `/courses/lessons/lesson_01`: 200 and contains `日本人老师提示`, `讲解任务`, `本课常用套路`
  - `/speaking/self-training`: 200 and contains `日语自训工作台`, `句型拆解`, `NG 改写`, `对话补全`, `60 秒输出`, `我的笔记`

## Not Run

- Real authenticated student recording E2E was not run because no test student session was provided.
- Real teacher feedback loop was not run.

## Next Action

Use a test student account to open `/speaking/self-training`, complete one NG 改写 and one 60 秒输出 recording, then review whether the checklist wording is clear enough for beginner Chinese SAP consultants.
