import { ReactNode } from "react";

const tones = {
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  red: "bg-rose-50 text-rose-700 ring-rose-200",
  teal: "bg-teal-50 text-teal-700 ring-teal-200"
};

export function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: keyof typeof tones }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ${tones[tone]}`}>
      {children}
    </span>
  );
}
