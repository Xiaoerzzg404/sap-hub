import { ConsultantOutputClient } from "@/components/pages/ConsultantOutputClient";
import { requireRoles } from "@/lib/auth/guards";
import { getAllLessonsWithContent } from "@/lib/content/lessons";

export default async function ConsultantOutputPage() {
  await requireRoles(["student"], "/speaking/consultant-output");
  const lessons = await getAllLessonsWithContent();
  return <ConsultantOutputClient lessons={lessons} />;
}
