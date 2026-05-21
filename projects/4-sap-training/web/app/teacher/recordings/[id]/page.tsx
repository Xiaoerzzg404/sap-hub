import { TeacherRecordingDetailClient } from "@/components/teacher/TeacherRecordingDetailClient";
import { requireRoles } from "@/lib/auth/guards";

export default async function TeacherRecordingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireRoles(["teacher"], `/teacher/recordings/${id}`);
  return <TeacherRecordingDetailClient id={id} />;
}
