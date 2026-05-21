import Link from "next/link";
import { requireRoles } from "@/lib/auth/guards";

const links = [
  ["/speaking/self-training", "日语自训工作台"],
  ["/speaking/shadowing", "Shadowing 跟读"],
  ["/speaking/repeat-player", "重复播放器"],
  ["/speaking/recording", "录音室"],
  ["/speaking/micro-training", "30 秒训练"],
  ["/speaking/consultant-output", "60 秒顾问输出"],
];

export default async function SpeakingPage() {
  await requireRoles(["student"], "/speaking");

  return (
    <div className="page-shell space-y-6">
      <div>
        <p className="text-sm font-semibold text-sap">Speaking</p>
        <h1 className="text-2xl font-bold text-ink">口语训练中心</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {links.map(([href, label]) => (
          <Link key={href} href={href} className="panel p-5 hover:bg-mist">
            <h2 className="text-lg font-semibold text-ink">{label}</h2>
            <p className="mt-2 text-sm text-slate-600">
              进入对应训练，完成播放、录音、回放和自评。
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
