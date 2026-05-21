import { AssignmentsClient } from "@/components/pages/AssignmentsClient";
import { requireRoles } from "@/lib/auth/guards";
import { getAllLessons, getAssignments } from "@/lib/content/lessons";

export default async function AssignmentsPage() {
  await requireRoles(["student"], "/assignments");
  const [lessons, allAssignments] = await Promise.all([getAllLessons(), getAssignments()]);
  return <AssignmentsClient lessons={lessons} allAssignments={allAssignments} />;
}
