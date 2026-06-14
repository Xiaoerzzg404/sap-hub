import { requireRoles } from "@/lib/auth/guards";
import { getLibraryItems } from "@/lib/content/lessons";
import { LibraryClient } from "@/components/library/LibraryClient";

export default async function LibraryPage() {
  await requireRoles(["student", "teacher"], "/library");
  const items = await getLibraryItems();

  return (
    <div className="page-shell space-y-6">
      <div>
        <p className="text-sm font-semibold text-sap">Library</p>
        <h1 className="text-2xl font-bold text-ink">全课程总表 · 跨课资料</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          跨 24 课的总表与手册：术语总表、句型总表、RolePlay
          合集、讲师手册、学生讲义、质量审查报告。
        </p>
      </div>
      <LibraryClient items={items} />
    </div>
  );
}
