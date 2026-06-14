import { createCoachResource } from "@/app/actions";
import { CoachForm } from "@/components/domain-forms";

export default function NewCoachPage() {
  return (
    <>
      <div>
        <h2 className="text-xl font-bold text-slate-950">新增教练资源</h2>
        <p className="mt-1 text-sm text-slate-600">把外部建议变成可执行的经营动作。</p>
      </div>
      <CoachForm action={createCoachResource} />
    </>
  );
}
