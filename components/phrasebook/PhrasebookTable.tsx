import type { Phrase } from "@/types/phrase";
import { PhraseCard } from "@/components/lesson/PhraseCard";

export function PhrasebookTable({ phrases }: { phrases: Phrase[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {phrases.map((phrase) => (
        <PhraseCard key={phrase.id} phrase={phrase} />
      ))}
    </div>
  );
}
