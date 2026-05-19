import { GlossaryClient } from "@/components/pages/GlossaryClient";
import { getGlossaryTerms } from "@/lib/content/lessons";

export default async function GlossaryPage() {
  const terms = await getGlossaryTerms();
  return <GlossaryClient terms={terms} />;
}
