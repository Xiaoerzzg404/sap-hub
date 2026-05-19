import { PhrasebookClient } from "@/components/pages/PhrasebookClient";
import { getPhrases } from "@/lib/content/lessons";

export default async function PhrasebookPage() {
  const phrases = await getPhrases();
  return <PhrasebookClient phrases={phrases} />;
}
