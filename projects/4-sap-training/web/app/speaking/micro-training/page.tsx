"use client";

import { useState } from "react";
import { allLessons } from "@/lib/content-loader";
import { MicroTrainingTimer } from "@/components/speaking/MicroTrainingTimer";

export default function MicroTrainingPage() {
  const [lessonId, setLessonId] = useState(allLessons[0]?.id ?? "");
  const lesson = allLessons.find((item) => item.id === lessonId) ?? allLessons[0];

  return (
    <div className="page-shell space-y-6">
      <div>
        <p className="text-sm font-semibold text-sap">Micro Training</p>
        <h1 className="text-2xl font-bold text-ink">30 秒输出训练</h1>
      </div>
      <select className="input w-full" value={lessonId} onChange={(event) => setLessonId(event.target.value)}>
        {allLessons.map((item) => (
          <option key={item.id} value={item.id}>
            第 {String(item.order).padStart(2, "0")} 课 · {item.title}
          </option>
        ))}
      </select>
      <div className="space-y-4">
        {lesson.microTrainings.map((task) => (
          <MicroTrainingTimer key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
