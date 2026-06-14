import { createConsultant } from "@/app/actions";
import { ConsultantForm } from "@/components/domain-forms";

export default function NewConsultantPage() {
  return (
    <>
      <div>
        <h2 className="text-xl font-bold text-slate-950">新增顾问档案</h2>
        <p className="mt-1 text-sm text-slate-600">能力总分会按系统权重自动计算，不能手工覆盖。</p>
      </div>
      <ConsultantForm action={createConsultant} />
    </>
  );
}
