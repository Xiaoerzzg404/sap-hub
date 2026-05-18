"use client";

import { useMemo, useState } from "react";
import { allLessons } from "@/lib/content-loader";
import { ShadowingCard } from "@/components/speaking/ShadowingCard";

export default function ShadowingPage() {
  const [lessonId, setLessonId] = useState(allLessons[0]?.id ?? "");
  const [scenario, setScenario] = useState("");
  const lesson = allLessons.find((item) => item.id === lessonId) ?? allLessons[0];
  const scenarios = Array.from(new Set(lesson.shadowingItems.map((item) => item.scenario)));
  const items = useMemo(
    () => lesson.shadowingItems.filter((item) => !scenario || item.scenario === scenario).slice(0, 12),
    [lesson.shadowingItems, scenario]
  );

  return (
    <div className="page-shell space-y-6">
      <div>
        <p className="text-sm font-semibold text-sap">Shadowing</p>
        <h1 className="text-2xl font-bold text-ink">跟读训练</h1>
      </div>
      <div className="panel grid gap-3 p-4 md:grid-cols-2">
        <select className="input" value={lessonId} onChange={(event) => setLessonId(event.target.value)}>
          {allLessons.map((item) => (
            <option key={item.id} value={item.id}>
              第 {String(item.order).padStart(2, "0")} 课 · {item.title}
            </option>
          ))}
        </select>
        <select className="input" value={scenario} onChange={(event) => setScenario(event.target.value)}>
          <option value="">全部场景</option>
          {scenarios.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-4">
        {items.map((item) => (
          <ShadowingCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
