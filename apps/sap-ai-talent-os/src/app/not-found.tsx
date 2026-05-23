import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
      <h2 className="text-lg font-bold text-slate-950">没有找到记录</h2>
      <p className="mt-2 text-sm text-slate-600">这条数据可能已经被删除，或当前筛选条件不匹配。</p>
      <Link className="mt-4 inline-flex rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white" href="/dashboard">
        返回总览
      </Link>
    </div>
  );
}
