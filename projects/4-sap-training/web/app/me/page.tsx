import { MyLearningClient } from "@/components/pages/MyLearningClient";
import { getAllLessons } from "@/lib/content/lessons";

export default async function MyLearningPage() {
  const lessons = await getAllLessons();
  return <MyLearningClient lessons={lessons} />;
}
