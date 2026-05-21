import Link from "next/link";
import { Mic, ScrollText } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/options";
import { getAllLessonsWithContent, getReviewTerms } from "@/lib/content/lessons";
import { getJapaneseCoachData } from "@/lib/japanese-coach";
import { JapaneseTeacherCoachPanel } from "@/components/teacher/JapaneseTeacherCoachPanel";
import { ReviewTermsTable } from "@/components/teacher/ReviewTermsTable";
import { TeacherLessonAssetsBrowser } from "@/components/teacher/TeacherLessonAssetsBrowser";

export default async function TeacherPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/teacher");
  if (session.user.role !== "teacher" && session.user.role !== "admin") redirect("/");

  const [allLessons, allReviewTerms] = await Promise.all([
    getAllLessonsWithContent(),
    getReviewTerms(),
  ]);
  const coachData = getJapaneseCoachData();
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
        <div className="flex flex-wrap gap-2">
          <Link href="/teacher/recordings" className="btn-primary">
            <Mic className="h-4 w-4" />
            学生录音作业
          </Link>
          <Link href="/teacher/review-terms" className="btn-secondary">
            <ScrollText className="h-4 w-4" />
            待复核术语
          </Link>
        </div>
      </div>
      <div className="panel border-green-200 bg-green-50 p-4">
        <p className="text-sm font-semibold text-green-900">讲师专区 · Phase 6 录音点评闭环可用</p>
        <div className="mt-2 grid gap-3 text-xs text-green-800 sm:grid-cols-3">
          <div>
            <p className="font-semibold">可用</p>
            <ul className="mt-1 list-disc pl-4">
              <li>浏览全部课程内容</li>
              <li>查看待复核术语</li>
              <li>看学生录音作业</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold">讲师操作</p>
            <ul className="mt-1 list-disc pl-4">
              <li>给学生打分</li>
              <li>给学生反馈</li>
              <li>邮件通知学生</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold">安全边界</p>
            <ul className="mt-1 list-disc pl-4">
              <li>讲师只看自己班学生</li>
              <li>admin 可看全部</li>
            </ul>
          </div>
        </div>
      </div>
      <JapaneseTeacherCoachPanel
        coachData={coachData}
        lessons={allLessons.map((lesson) => ({
          id: lesson.id,
          order: lesson.order,
          title: lesson.title,
        }))}
      />
      <TeacherLessonAssetsBrowser lessons={allLessons} />
      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="课程设计稿" value={`${allLessons.length}`} />
        <Metric label="课堂逐字稿" value={`${allLessons.length}`} />
        <Metric
          label="待复核术语"
          value={`${allReviewTerms.filter((item) => item.mustReview).length}`}
        />
        <Metric label="缺失课程" value={`${missing.length}`} />
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">待复核术语</h2>
        <ReviewTermsTable items={allReviewTerms.slice(0, 20)} />
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">学生录音作业</h2>
        <Link
          href="/teacher/recordings"
          className="panel flex items-center justify-between gap-3 p-4 hover:bg-mist"
        >
          <span className="text-sm text-slate-600">
            进入讲师录音列表，听学生录音并提交评分反馈。
          </span>
          <Mic className="h-5 w-5 text-sap" />
        </Link>
      </section>
      <section className="panel p-4">
        <h2 className="font-semibold text-ink">课程质量检查表</h2>
        <p className="mt-2 text-sm text-slate-600">
          每课检查：课程设计、逐字稿、术语、句型、Shadowing、30秒训练、60秒输出、Role
          Play、作业、待复核清单。
        </p>
        <div className="mt-3 text-sm text-slate-600">
          {missing.length ? (
            missing.map((lesson) => <p key={lesson.id}>{lesson.id} 内容不足</p>)
          ) : (
            <p>24 课均已具备训练站 MVP 数据。</p>
          )}
        </div>
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
