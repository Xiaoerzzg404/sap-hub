import { RoleplayClient } from "@/components/pages/RoleplayClient";
import { requireRoles } from "@/lib/auth/guards";
import { getAllLessons, getRoleplays } from "@/lib/content/lessons";

export default async function RoleplayPage() {
  await requireRoles(["student"], "/roleplay");
  const [lessons, allRoleplays] = await Promise.all([getAllLessons(), getRoleplays()]);
  return <RoleplayClient lessons={lessons} allRoleplays={allRoleplays} />;
}
