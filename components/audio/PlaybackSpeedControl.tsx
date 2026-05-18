"use client";

const SPEEDS = [0.75, 0.8, 1, 1.25] as const;

export function PlaybackSpeedControl({
  value,
  onChange
}: {
  value: number;
  onChange: (speed: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold text-slate-600">速度</span>
      {SPEEDS.map((speed) => (
        <button
          key={speed}
          type="button"
          className={speed === value ? "btn-primary px-2 py-1 text-xs" : "btn-secondary px-2 py-1 text-xs"}
          onClick={() => onChange(speed)}
        >
          {speed}x
        </button>
      ))}
    </div>
  );
}
