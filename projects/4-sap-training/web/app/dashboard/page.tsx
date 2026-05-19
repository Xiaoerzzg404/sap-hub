import { DashboardClient } from "@/components/pages/DashboardClient";
import { getAllLessonsWithContent } from "@/lib/content/lessons";

export default async function DashboardPage() {
  const lessons = await getAllLessonsWithContent();
  return <DashboardClient lessons={lessons} />;
}
