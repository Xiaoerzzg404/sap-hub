import { DashboardClient } from "@/components/pages/DashboardClient";
import { requireRoles } from "@/lib/auth/guards";
import { getAllLessonsWithContent } from "@/lib/content/lessons";

export default async function DashboardPage() {
  await requireRoles(["student"], "/dashboard");
  const lessons = await getAllLessonsWithContent();
  return <DashboardClient lessons={lessons} />;
}
