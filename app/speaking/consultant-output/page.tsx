"use client";

import { useState } from "react";
import { allLessons } from "@/lib/content-loader";
import { ConsultantOutputRecorder } from "@/components/speaking/ConsultantOutputRecorder";

export default function ConsultantOutputPage() {
  const [lessonId, setLessonId] = useState(allLessons[0]?.id ?? "");
  const lesson = allLessons.find((item) => item.id === lessonId) ?? allLessons[0];

  return (
    <div className="page-shell space-y-6">
      <div>
        <p className="text-sm font-semibold text-sap">Consultant Output</p>
        <h1 className="text-2xl font-bold text-ink">60 秒顾问输出</h1>
      </div>
      <select className="input w-full" value={lessonId} onChange={(event) => setLessonId(event.target.value)}>
        {allLessons.map((item) => (
          <option key={item.id} value={item.id}>
            第 {String(item.order).padStart(2, "0")} 课 · {item.title}
          </option>
        ))}
      </select>
      <div className="space-y-4">
        {lesson.consultantOutputs.map((task) => (
          <ConsultantOutputRecorder key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
