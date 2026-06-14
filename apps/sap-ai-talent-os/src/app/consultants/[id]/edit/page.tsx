import { notFound } from "next/navigation";
import { updateConsultant } from "@/app/actions";
import { ConsultantForm } from "@/components/domain-forms";
import { prisma } from "@/lib/prisma";

export default async function EditConsultantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const consultant = await prisma.consultant.findUnique({ where: { id } });
  if (!consultant) notFound();

  return (
    <>
      <div>
        <h2 className="text-xl font-bold text-slate-950">编辑顾问档案</h2>
        <p className="mt-1 text-sm text-slate-600">保存后系统会重新计算能力总分。</p>
      </div>
      <ConsultantForm action={updateConsultant.bind(null, consultant.id)} consultant={consultant} />
    </>
  );
}
