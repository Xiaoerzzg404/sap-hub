import { MicroTrainingClient } from "@/components/pages/MicroTrainingClient";
import { getAllLessonsWithContent } from "@/lib/content/lessons";

export default async function MicroTrainingPage() {
  const lessons = await getAllLessonsWithContent();
  return <MicroTrainingClient lessons={lessons} />;
}
