import { ReviewClient } from "@/components/pages/ReviewClient";
import { getAllLessonsWithContent, getGlossaryTerms, getPhrases } from "@/lib/content/lessons";

export default async function ReviewPage() {
  const [lessons, glossary, phrases] = await Promise.all([getAllLessonsWithContent(), getGlossaryTerms(), getPhrases()]);
  return <ReviewClient lessons={lessons} glossary={glossary} phrases={phrases} />;
}
