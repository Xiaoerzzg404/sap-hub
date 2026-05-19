import { AssignmentsClient } from "@/components/pages/AssignmentsClient";
import { getAllLessons, getAssignments } from "@/lib/content/lessons";

export default async function AssignmentsPage() {
  const [lessons, allAssignments] = await Promise.all([getAllLessons(), getAssignments()]);
  return <AssignmentsClient lessons={lessons} allAssignments={allAssignments} />;
}
