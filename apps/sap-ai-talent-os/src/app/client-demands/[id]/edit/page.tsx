import { notFound } from "next/navigation";
import { updateClientDemand } from "@/app/actions";
import { ClientDemandForm } from "@/components/domain-forms";
import { prisma } from "@/lib/prisma";

export default async function EditClientDemandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const demand = await prisma.clientDemand.findUnique({ where: { id } });
  if (!demand) notFound();
  return (
    <>
      <div>
        <h2 className="text-xl font-bold text-slate-950">编辑客户需求</h2>
        <p className="mt-1 text-sm text-slate-600">需求越清楚，内部评估和候选人筛选越稳。</p>
      </div>
      <ClientDemandForm action={updateClientDemand.bind(null, demand.id)} demand={demand} />
    </>
  );
}
