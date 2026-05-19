import Link from "next/link";
import { allLessons, allReviewTerms } from "@/lib/content-loader";
import { ReviewTermsTable } from "@/components/teacher/ReviewTermsTable";
import { StudentRecordingReview } from "@/components/teacher/StudentRecordingReview";
import { TeacherLessonAssetsBrowser } from "@/components/teacher/TeacherLessonAssetsBrowser";

export default function TeacherPage() {
  const missing = allLessons.filter(
    (lesson) =>
      lesson.terms.length === 0 ||
      lesson.phrases.length === 0 ||
      lesson.shadowingItems.length === 0 ||
      lesson.rolePlays.length === 0 ||
      lesson.microTrainings.length === 0
  );

  return (
    <div className="page-shell space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-sap">Teacher</p>
          <h1 className="text-2xl font-bold text-ink">讲师专区</h1>
        </div>
        <Link href="/teacher/review-terms" className="btn-primary">
          待复核术语
        </Link>
      </div>
      <div className="panel border-amber-300 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-900">讲师专区 · 当前是教学内容预览站（v0.x alpha）</p>
        <div className="mt-2 grid gap-3 text-xs text-amber-800 sm:grid-cols-3">
          <div>
            <p className="font-semibold">可用</p>
            <ul className="mt-1 list-disc pl-4">
              <li>浏览全部课程内容</li>
              <li>查看待复核术语</li>
              <li>抽样课程质量</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold">暂不可用</p>
            <ul className="mt-1 list-disc pl-4">
              <li>看学生录音作业</li>
              <li>给学生打分</li>
              <li>给学生反馈</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold">预计 v1.0</p>
            <ul className="mt-1 list-disc pl-4">
              <li>真讲师后台（Phase 5/6）</li>
            </ul>
          </div>
        </div>
      </div>
      <TeacherLessonAssetsBrowser lessons={allLessons} />
      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="课程设计稿" value={`${allLessons.length}`} />
        <Metric label="课堂逐字稿" value={`${allLessons.length}`} />
        <Metric label="待复核术语" value={`${allReviewTerms.filter((item) => item.mustReview).length}`} />
        <Metric label="缺失课程" value={`${missing.length}`} />
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">待复核术语</h2>
        <ReviewTermsTable items={allReviewTerms.slice(0, 20)} />
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">学生录音作业占位列表</h2>
        <StudentRecordingReview />
      </section>
      <section className="panel p-4">
        <h2 className="font-semibold text-ink">课程质量检查表</h2>
        <p className="mt-2 text-sm text-slate-600">每课检查：课程设计、逐字稿、术语、句型、Shadowing、30秒训练、60秒输出、Role Play、作业、待复核清单。</p>
        <div className="mt-3 text-sm text-slate-600">{missing.length ? missing.map((lesson) => <p key={lesson.id}>{lesson.id} 内容不足</p>) : <p>24 课均已具备训练站 MVP 数据。</p>}</div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}
