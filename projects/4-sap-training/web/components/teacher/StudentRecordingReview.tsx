export function StudentRecordingReview() {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
      <p className="text-sm font-semibold text-amber-900">学生录音查看 · 当前不可用</p>
      <p className="mt-2 text-sm leading-relaxed text-amber-800">
        本功能需要后端支持（Phase 5/6 上线后真正可用）。当前版本学生录音仅存储在学生自己的浏览器 IndexedDB，讲师无法跨设备查看。
      </p>
      <p className="mt-2 text-sm leading-relaxed text-amber-800">
        如需点评，请暂时让学生通过其他渠道（邮件 / 网盘）直接发录音文件。
      </p>
      <p className="mt-3 text-xs text-amber-700">
        预计上线：v1.0 · 详见 <code className="rounded bg-white px-1">logs/codex-evolution-roadmap.md</code> Phase 5/6
      </p>
    </div>
  );
}
