import { createContentItem } from "@/app/actions";
import { ContentForm } from "@/components/domain-forms";

export default function NewContentPage() {
  return (
    <>
      <div>
        <h2 className="text-xl font-bold text-slate-950">新增内容选题</h2>
        <p className="mt-1 text-sm text-slate-600">把项目经验、学员问题和客户访谈沉淀成可复用内容资产。</p>
      </div>
      <ContentForm action={createContentItem} />
    </>
  );
}
