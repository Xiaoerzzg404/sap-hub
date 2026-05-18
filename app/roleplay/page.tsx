"use client";

import { useMemo, useState } from "react";
import { allLessons, allRoleplays } from "@/lib/content-loader";
import { RolePlayRecorder } from "@/components/speaking/RolePlayRecorder";

export default function RoleplayPage() {
  const [lessonId, setLessonId] = useState(allLessons[0]?.id ?? "");
  const [roleplayId, setRoleplayId] = useState("");
  const roleplays = useMemo(() => allRoleplays.filter((item) => item.lessonId === lessonId), [lessonId]);
  const selected = roleplays.find((item) => item.id === roleplayId) ?? roleplays[0];

  return (
    <div className="page-shell space-y-6">
      <div>
        <p className="text-sm font-semibold text-sap">Role Play</p>
        <h1 className="text-2xl font-bold text-ink">项目场景角色扮演</h1>
      </div>
      <div className="panel grid gap-3 p-4 md:grid-cols-2">
        <select className="input" value={lessonId} onChange={(event) => setLessonId(event.target.value)}>
          {allLessons.map((item) => (
            <option key={item.id} value={item.id}>
              第 {String(item.order).padStart(2, "0")} 课 · {item.title}
            </option>
          ))}
        </select>
        <select className="input" value={selected?.id ?? ""} onChange={(event) => setRoleplayId(event.target.value)}>
          {roleplays.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
      </div>
      {selected ? <RolePlayRecorder rolePlay={selected} /> : null}
    </div>
  );
}
