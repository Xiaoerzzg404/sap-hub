import { RepeatPlayerClient } from "@/components/pages/RepeatPlayerClient";
import { getAllLessonsWithContent } from "@/lib/content/lessons";

export default async function RepeatPlayerPage() {
  const lessons = await getAllLessonsWithContent();
  return <RepeatPlayerClient lessons={lessons} />;
}
