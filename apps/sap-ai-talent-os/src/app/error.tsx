"use client";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="rounded-lg border border-rose-200 bg-white p-6 shadow-soft">
      <h2 className="text-lg font-bold text-rose-700">页面处理失败</h2>
      <p className="mt-2 text-sm text-slate-700">{error.message || "请检查输入内容后重试。"}</p>
      <button
        className="mt-4 rounded-md bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800"
        onClick={() => reset()}
      >
        重试
      </button>
    </div>
  );
}
