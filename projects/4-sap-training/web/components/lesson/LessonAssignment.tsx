import type { Assignment } from "@/types/assignment";
import { RecordingPanel } from "@/components/audio/RecordingPanel";
import { AssignmentTextInput } from "./AssignmentTextInput";

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
              <AssignmentTextInput assignmentId={assignment.id} prompt={assignment.prompt} />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
