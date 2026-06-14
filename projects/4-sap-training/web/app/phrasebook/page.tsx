import { PhrasebookClient } from "@/components/pages/PhrasebookClient";
import { requireRoles } from "@/lib/auth/guards";
import { getPhrases } from "@/lib/content/lessons";

export default async function PhrasebookPage() {
  await requireRoles(["student", "teacher"], "/phrasebook");
  const phrases = await getPhrases();
  return <PhrasebookClient phrases={phrases} />;
}
