import { redirect } from "next/navigation";
import { TeacherRecordingDetailClient } from "@/components/teacher/TeacherRecordingDetailClient";
import { auth } from "@/lib/auth/options";

export default async function TeacherRecordingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/teacher/recordings");
  if (session.user.role !== "teacher" && session.user.role !== "admin") redirect("/");

  const { id } = await params;
  return <TeacherRecordingDetailClient id={id} />;
}
