import { ConsultantOutputClient } from "@/components/pages/ConsultantOutputClient";
import { getAllLessonsWithContent } from "@/lib/content/lessons";

export default async function ConsultantOutputPage() {
  const lessons = await getAllLessonsWithContent();
  return <ConsultantOutputClient lessons={lessons} />;
}
