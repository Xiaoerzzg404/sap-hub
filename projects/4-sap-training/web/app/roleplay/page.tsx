import { RoleplayClient } from "@/components/pages/RoleplayClient";
import { getAllLessons, getRoleplays } from "@/lib/content/lessons";

export default async function RoleplayPage() {
  const [lessons, allRoleplays] = await Promise.all([getAllLessons(), getRoleplays()]);
  return <RoleplayClient lessons={lessons} allRoleplays={allRoleplays} />;
}
