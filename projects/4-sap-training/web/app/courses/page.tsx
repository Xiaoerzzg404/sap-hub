import Link from "next/link";
import { requireRoles } from "@/lib/auth/guards";
import { getAllLessons } from "@/lib/content/lessons";
import { LessonNav } from "@/components/layout/LessonNav";

export default async function CoursesPage() {
  await requireRoles(["student", "teacher"], "/courses");
  const allLessons = await getAllLessons();

  return (
    <div className="page-shell space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-sap">Courses</p>
          <h1 className="text-2xl font-bold text-ink">24 课 SAP 日语口语训练</h1>
        </div>
        <Link href="/speaking/repeat-player" className="btn-secondary">
          进入重复播放器
        </Link>
      </div>
      <LessonNav lessons={allLessons} />
    </div>
  );
}
