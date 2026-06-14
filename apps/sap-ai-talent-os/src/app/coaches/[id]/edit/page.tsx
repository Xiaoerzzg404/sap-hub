import { notFound } from "next/navigation";
import { updateCoachResource } from "@/app/actions";
import { CoachForm } from "@/components/domain-forms";
import { prisma } from "@/lib/prisma";

export default async function EditCoachPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const coach = await prisma.coachResource.findUnique({ where: { id } });
  if (!coach) notFound();
  return (
    <>
      <div>
        <h2 className="text-xl font-bold text-slate-950">编辑教练资源</h2>
        <p className="mt-1 text-sm text-slate-600">维护请教主题、建议和下一步行动。</p>
      </div>
      <CoachForm action={updateCoachResource.bind(null, coach.id)} coach={coach} />
    </>
  );
}
