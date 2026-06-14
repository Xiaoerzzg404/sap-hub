import { MyLearningClient } from "@/components/pages/MyLearningClient";
import { requireRoles } from "@/lib/auth/guards";
import { getAllLessons } from "@/lib/content/lessons";

export default async function MyLearningPage() {
  await requireRoles(["student"], "/me");
  const lessons = await getAllLessons();
  return <MyLearningClient lessons={lessons} />;
}
