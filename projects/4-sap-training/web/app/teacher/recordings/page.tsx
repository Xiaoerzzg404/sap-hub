import { redirect } from "next/navigation";
import { TeacherRecordingsClient } from "@/components/teacher/TeacherRecordingsClient";
import { auth } from "@/lib/auth/options";

export default async function TeacherRecordingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/teacher/recordings");
  if (session.user.role !== "teacher" && session.user.role !== "admin") redirect("/");

  return <TeacherRecordingsClient />;
}
