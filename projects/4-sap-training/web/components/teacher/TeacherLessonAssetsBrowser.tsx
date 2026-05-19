"use client";

import { useState } from "react";
import type { Lesson } from "@/types/lesson";
import { LessonAssetsTabs } from "@/components/lesson/LessonAssetsTabs";

export function TeacherLessonAssetsBrowser({ lessons }: { lessons: Lesson[] }) {
  const [lessonId, setLessonId] = useState(lessons[0]?.id ?? "");
  const lesson = lessons.find((l) => l.id === lessonId) ?? lessons[0];

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">单课全资料浏览（讲师视角）</h2>
          <p className="mt-1 text-xs text-slate-500">
            学生看不到的 teacher-script-v4 / case-pack-v4 / quality-check-v4 在这里可见。
          </p>
        </div>
        <select
          className="input"
          value={lessonId}
          onChange={(e) => setLessonId(e.target.value)}
        >
          {lessons.map((l) => (
            <option key={l.id} value={l.id}>
              第 {String(l.order).padStart(2, "0")} 课 · {l.title}
            </option>
          ))}
        </select>
      </div>
      {lesson ? <LessonAssetsTabs lesson={lesson} viewerRole="teacher" /> : null}
    </section>
  );
}
