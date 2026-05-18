import Link from "next/link";
import type { Lesson } from "@/types/lesson";
import { lessonNumberLabel } from "@/lib/lesson-utils";

export function LessonNav({ lessons, currentId }: { lessons: Lesson[]; currentId?: string }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {lessons.map((lesson) => (
        <Link
          key={lesson.id}
          href={`/courses/lessons/${lesson.id}`}
          className={`rounded-lg border p-3 text-sm ${
            lesson.id === currentId ? "border-sap bg-blue-50" : "border-line bg-white hover:bg-mist"
          }`}
        >
          <div className="font-semibold text-sap">{lessonNumberLabel(lesson)}</div>
          <div className="mt-1 line-clamp-2 text-ink">{lesson.title}</div>
        </Link>
      ))}
    </div>
  );
}
