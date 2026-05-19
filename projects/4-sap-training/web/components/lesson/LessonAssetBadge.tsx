import type { LessonAsset } from "@/types/lesson";

const KIND_SHORT: Record<LessonAsset["kind"], string> = {
  "course-design": "设计稿",
  "classroom-transcript": "逐字稿",
  "practice-homework": "练习",
  "review-checklist": "待复核",
  "package-readme": "课程包",
  "teacher-script-v4": "讲师稿",
  "student-ppt-v4": "学生 PPT",
  "classroom-workbook-v4": "练习册",
  "case-pack-v4": "案例包",
  "quality-check-v4": "质量审查",
};

export function LessonAssetBadge({ assets }: { assets: LessonAsset[] }) {
  if (!assets?.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold text-slate-600">本课资料 {assets.length} 份</span>
      {assets.map((a) => (
        <span
          key={a.kind}
          className="rounded-md border border-line bg-mist px-2 py-0.5 text-xs text-slate-700"
        >
          {KIND_SHORT[a.kind] ?? a.kind}
        </span>
      ))}
    </div>
  );
}
