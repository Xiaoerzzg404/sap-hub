import { ShadowingClient } from "@/components/pages/ShadowingClient";
import { requireRoles } from "@/lib/auth/guards";
import { getAllLessonsWithContent } from "@/lib/content/lessons";

export default async function ShadowingPage() {
  await requireRoles(["student"], "/speaking/shadowing");
  const lessons = await getAllLessonsWithContent();
  return <ShadowingClient lessons={lessons} />;
}
