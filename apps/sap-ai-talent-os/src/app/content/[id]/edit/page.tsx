import { notFound } from "next/navigation";
import { updateContentItem } from "@/app/actions";
import { ContentForm } from "@/components/domain-forms";
import { prisma } from "@/lib/prisma";

export default async function EditContentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await prisma.contentItem.findUnique({ where: { id } });
  if (!item) notFound();
  return (
    <>
      <div>
        <h2 className="text-xl font-bold text-slate-950">编辑内容选题</h2>
        <p className="mt-1 text-sm text-slate-600">更新状态、渠道、CTA 和关联产品。</p>
      </div>
      <ContentForm action={updateContentItem.bind(null, item.id)} item={item} />
    </>
  );
}
