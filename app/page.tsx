import Link from "next/link";
import { Headphones, Mic2, PlayCircle, Repeat2, RotateCcw } from "lucide-react";
import { allLessons } from "@/lib/content-loader";
import { ProgressBar } from "@/components/layout/ProgressBar";

const loop = [
  { label: "听", desc: "标准句播放、慢速播放、AB Repeat", icon: Headphones },
  { label: "读", desc: "Shadowing 跟读，每句至少 3 遍", icon: PlayCircle },
  { label: "录", desc: "浏览器录音，本地 IndexedDB 保存", icon: Mic2 },
  { label: "回放", desc: "回听自己的项目现场表达", icon: Repeat2 },
  { label: "复盘", desc: "收藏难句、低分自评、待复习术语", icon: RotateCcw }
];

export default function HomePage() {
  const firstLesson = allLessons[0];
  return (
    <div className="page-shell space-y-6">
      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="panel p-6">
          <p className="text-sm font-semibold text-sap">面向成人 SAP 顾问的日本项目口语训练</p>
          <h2 className="mt-3 max-w-3xl text-4xl font-bold leading-tight text-ink">把 24 课 SAP 日语内容练成能开口、能复盘、能交付的顾问表达。</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            这里不是资料站。每课都围绕听、读、录、回放、复盘展开，学生在浏览器里完成 Shadowing、30 秒任务、60 秒顾问输出和 Role Play。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="btn-primary" href={`/courses/lessons/${firstLesson?.id ?? "lesson_01"}`}>
              开始第 01 课
            </Link>
            <Link className="btn-secondary" href="/dashboard">
              查看今日任务
            </Link>
          </div>
        </div>
        <div className="panel space-y-4 p-5">
          <h3 className="text-lg font-semibold text-ink">训练概览</h3>
          <Metric label="课程" value={`${allLessons.length} 课`} />
          <Metric label="口语入口" value="Shadowing / Repeat / 录音 / Role Play" />
          <ProgressBar value={0} label="本地学习进度" />
          <p className="text-xs text-slate-500">进度保存在 LocalStorage，录音保存在 IndexedDB。</p>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-5">
        {loop.map((item) => (
          <div key={item.label} className="panel p-4">
            <item.icon className="h-6 w-6 text-sap" />
            <h3 className="mt-3 text-xl font-bold text-ink">{item.label}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-mist p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-ink">{value}</p>
    </div>
  );
}
