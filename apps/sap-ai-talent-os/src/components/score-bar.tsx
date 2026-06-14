export function ScoreBar({ value, label }: { value: number; label?: string }) {
  const safe = Math.min(100, Math.max(0, Math.round(value || 0)));
  const color = safe >= 80 ? "bg-emerald-600" : safe >= 65 ? "bg-blue-600" : safe >= 50 ? "bg-amber-500" : "bg-rose-500";

  return (
    <div className="min-w-[120px]">
      <div className="mb-1 flex items-center justify-between gap-3 text-xs text-slate-600">
        <span>{label ?? "评分"}</span>
        <span className="font-semibold text-slate-900">{safe}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${safe}%` }} />
      </div>
    </div>
  );
}
