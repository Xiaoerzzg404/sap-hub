import { GlossaryClient } from "@/components/pages/GlossaryClient";
import { requireRoles } from "@/lib/auth/guards";
import { getGlossaryTerms } from "@/lib/content/lessons";

export default async function GlossaryPage() {
  await requireRoles(["student", "teacher"], "/glossary");
  const terms = await getGlossaryTerms();
  return <GlossaryClient terms={terms} />;
}
