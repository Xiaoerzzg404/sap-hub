import { createClientDemand } from "@/app/actions";
import { ClientDemandForm } from "@/components/domain-forms";

export default function NewClientDemandPage() {
  return (
    <>
      <div>
        <h2 className="text-xl font-bold text-slate-950">新增客户需求</h2>
        <p className="mt-1 text-sm text-slate-600">先记录业务问题、能力需求和风险边界，再做顾问资源推荐。</p>
      </div>
      <ClientDemandForm action={createClientDemand} />
    </>
  );
}
