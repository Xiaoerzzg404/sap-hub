"use client";

import type { SubstitutionDrill } from "@/types/lesson";
import { RecordingPanel } from "@/components/audio/RecordingPanel";

export function SubstitutionDrillCard({ drill }: { drill: SubstitutionDrill }) {
  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <p className="text-xs font-semibold text-sap">Substitution Drill</p>
      <h3 lang="ja" className="mt-1 text-lg font-semibold text-ink">{drill.baseSentence}</h3>
      <p className="mt-2 text-sm text-slate-600">{drill.prompt}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {drill.replacements.map((replacement) => (
          <span key={replacement} className="rounded-md bg-mist px-2 py-1 text-sm text-slate-700">
            {replacement}
          </span>
        ))}
      </div>
      <div className="mt-3">
        <RecordingPanel lessonId={drill.lessonId} practiceType="shadowing" promptText={drill.prompt} targetJapanese={drill.baseSentence} />
      </div>
    </div>
  );
}
