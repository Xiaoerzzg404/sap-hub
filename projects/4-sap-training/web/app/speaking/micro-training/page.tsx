import { MicroTrainingClient } from "@/components/pages/MicroTrainingClient";
import { requireRoles } from "@/lib/auth/guards";
import { getAllLessonsWithContent } from "@/lib/content/lessons";

export default async function MicroTrainingPage() {
  await requireRoles(["student"], "/speaking/micro-training");
  const lessons = await getAllLessonsWithContent();
  return <MicroTrainingClient lessons={lessons} />;
}
