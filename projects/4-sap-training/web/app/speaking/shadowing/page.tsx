import { ShadowingClient } from "@/components/pages/ShadowingClient";
import { getAllLessonsWithContent } from "@/lib/content/lessons";

export default async function ShadowingPage() {
  const lessons = await getAllLessonsWithContent();
  return <ShadowingClient lessons={lessons} />;
}
