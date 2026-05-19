import Link from "next/link";
import { BookOpen, GraduationCap, Headphones, Mic2, PlayCircle, Repeat2, RotateCcw } from "lucide-react";
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
  const entries = [
    {
      href: `/courses/lessons/${firstLesson?.id ?? "lesson_01"}`,
      title: "试听 lesson_01",
      desc: "从术语预热开始走一遍 5 步训练。",
      icon: PlayCircle
    },
    {
      href: "/teacher",
      title: "我是讲师",
      desc: "查看课程资料、待复核术语和质量检查。",
      icon: GraduationCap
    },
    {
      href: "/courses",
      title: "24 课大纲",
      desc: "浏览基础线 jp-foundation 全部课次。",
      icon: BookOpen
    }
  ];

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
      <section className="grid gap-4 md:grid-cols-3">
        {entries.map((entry) => (
          <Link key={entry.href} href={entry.href} className="panel block p-4 hover:border-sap">
            <entry.icon className="h-6 w-6 text-sap" />
            <h3 className="mt-3 text-lg font-bold text-ink">{entry.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{entry.desc}</p>
          </Link>
        ))}
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
      <div className="panel border-amber-300 bg-amber-50 p-4 text-sm">
        <p className="font-semibold text-amber-900">当前版本说明 · v0.x alpha</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-amber-800">
          <li>录音和进度只保存在你当前的浏览器里，清除浏览数据 / 换设备 / 换浏览器都会丢</li>
          <li>讲师暂时无法直接查看你的录音，请把要点评的录音单独发给讲师</li>
          <li>本平台目前不支持多账号；同一台电脑多个学员请不要交叉使用</li>
          <li>我们正在接入用户系统、云端录音、讲师反馈，预计 v1 上线</li>
        </ul>
      </div>
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
