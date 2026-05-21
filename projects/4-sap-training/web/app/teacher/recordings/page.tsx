import { TeacherRecordingsClient } from "@/components/teacher/TeacherRecordingsClient";
import { requireRoles } from "@/lib/auth/guards";

export default async function TeacherRecordingsPage() {
  await requireRoles(["teacher"], "/teacher/recordings");

  return <TeacherRecordingsClient />;
}
