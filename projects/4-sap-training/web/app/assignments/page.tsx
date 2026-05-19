"use client";

import { useMemo, useState } from "react";
import { Mic2 } from "lucide-react";
import { allAssignments, allLessons } from "@/lib/content-loader";
import { RecordingPanel } from "@/components/audio/RecordingPanel";
import { AssignmentTextInput } from "@/components/lesson/AssignmentTextInput";

const typeLabels = {
  vocabulary: "词汇作业",
  phrase: "句型作业",
  recording: "录音作业",
  "consultant-output": "项目化输出作业",
  text: "文本作业"
};

export default function AssignmentsPage() {
  const [lessonId, setLessonId] = useState("");
  const assignments = useMemo(() => allAssignments.filter((item) => !lessonId || item.lessonId === lessonId), [lessonId]);
  const recordingAssignments = assignments.filter((item) => item.type === "recording" || item.type === "consultant-output");
  const textAssignments = assignments.filter((item) => item.type !== "recording" && item.type !== "consultant-output");

  return (
    <div className="page-shell space-y-6">
      <div>
        <p className="text-sm font-semibold text-sap">Assignments</p>
        <h1 className="text-2xl font-bold text-ink">作业中心</h1>
      </div>
      <select className="input w-full" value={lessonId} onChange={(event) => setLessonId(event.target.value)}>
        <option value="">全部课程</option>
        {allLessons.map((lesson) => (
          <option key={lesson.id} value={lesson.id}>
            第 {String(lesson.order).padStart(2, "0")} 课 · {lesson.title}
          </option>
        ))}
      </select>
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
          <Mic2 className="h-5 w-5 text-sap" />
          录音作业
        </h2>
        {recordingAssignments.slice(0, 12).map((assignment) => (
          <div key={assignment.id} className="panel p-4">
            <p className="font-semibold text-ink">{assignment.title}</p>
            <p className="mt-1 text-sm text-slate-600">{assignment.prompt}</p>
            <RecordingPanel
              lessonId={assignment.lessonId}
              practiceType={assignment.type === "consultant-output" ? "consultant-output" : "shadowing"}
              promptText={assignment.prompt}
              markAsAssignment
            />
          </div>
        ))}
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">文本与句型作业</h2>
        <div className="grid gap-3 lg:grid-cols-2">
          {textAssignments.slice(0, 24).map((assignment) => (
            <div key={assignment.id} className="panel p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-ink">{assignment.title}</p>
                <span className="rounded-md bg-mist px-2 py-1 text-xs text-slate-600">{typeLabels[assignment.type]}</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{assignment.prompt}</p>
              <AssignmentTextInput assignmentId={assignment.id} prompt={assignment.prompt} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
