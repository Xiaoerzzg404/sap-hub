import { RecordingHistory } from "@/components/audio/RecordingHistory";
import { RecordingPanel } from "@/components/audio/RecordingPanel";
import { requireRoles } from "@/lib/auth/guards";

export default async function RecordingPage() {
  await requireRoles(["student"], "/speaking/recording");

  return (
    <div className="page-shell space-y-6">
      <div>
        <p className="text-sm font-semibold text-sap">Recording</p>
        <h1 className="text-2xl font-bold text-ink">录音室</h1>
      </div>
      <RecordingPanel
        lessonId="free-practice"
        practiceType="shadowing"
        promptText="自由练习：请录一段 SAP 项目日语表达。"
      />
      <RecordingHistory />
    </div>
  );
}
