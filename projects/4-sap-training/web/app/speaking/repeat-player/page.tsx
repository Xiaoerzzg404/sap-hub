import { RepeatPlayerClient } from "@/components/pages/RepeatPlayerClient";
import { requireRoles } from "@/lib/auth/guards";
import { getAllLessonsWithContent } from "@/lib/content/lessons";

export default async function RepeatPlayerPage() {
  await requireRoles(["student"], "/speaking/repeat-player");
  const lessons = await getAllLessonsWithContent();
  return <RepeatPlayerClient lessons={lessons} />;
}
