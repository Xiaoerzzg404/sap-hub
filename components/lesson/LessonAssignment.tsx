import type { Assignment } from "@/types/assignment";
import { RecordingPanel } from "@/components/audio/RecordingPanel";

export function LessonAssignment({ assignments }: { assignments: Assignment[] }) {
  return (
    <section className="panel p-4">
      <h2 className="text-lg font-semibold text-ink">作业</h2>
      <div className="mt-3 space-y-3">
        {assignments.map((assignment) => (
          <div key={assignment.id} className="rounded-lg border border-line bg-white p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-ink">{assignment.title}</p>
                <p className="mt-1 text-sm text-slate-600">{assignment.prompt}</p>
              </div>
              <span className="rounded-md bg-mist px-2 py-1 text-xs text-slate-600">{assignment.type}</span>
            </div>
            {assignment.type === "recording" || assignment.type === "consultant-output" ? (
              <div className="mt-3">
                <RecordingPanel
                  lessonId={assignment.lessonId}
                  practiceType={assignment.type === "consultant-output" ? "consultant-output" : "shadowing"}
                  promptText={assignment.prompt}
                  markAsAssignment
                />
              </div>
            ) : (
              <textarea className="input mt-3 min-h-24 w-full" placeholder="输入文本作业，本地保存版本后续可接入数据库" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
