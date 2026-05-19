"use client";

import { useMemo, useState } from "react";
import { GlossaryCard } from "@/components/glossary/GlossaryCard";
import { GlossaryFilter } from "@/components/glossary/GlossaryFilter";
import { GlossaryTable } from "@/components/glossary/GlossaryTable";
import type { GlossaryTerm } from "@/types/glossary";

export function GlossaryClient({ terms: allGlossary }: { terms: GlossaryTerm[] }) {
  const [query, setQuery] = useState("");
  const [module, setModule] = useState("");
  const [phase, setPhase] = useState("");
  const terms = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allGlossary.filter((term) => {
      const matchQuery = !q || [term.chinese, term.englishOrSap, term.japanese, term.reading].join(" ").toLowerCase().includes(q);
      const matchModule = !module || term.module === module;
      const matchPhase = !phase || term.projectPhase === phase;
      return matchQuery && matchModule && matchPhase;
    });
  }, [allGlossary, query, module, phase]);

  return (
    <div className="page-shell space-y-6">
      <div>
        <p className="text-sm font-semibold text-sap">Glossary</p>
        <h1 className="text-2xl font-bold text-ink">SAP 日语术语库</h1>
      </div>
      <GlossaryFilter query={query} module={module} phase={phase} onQueryChange={setQuery} onModuleChange={setModule} onPhaseChange={setPhase} />
      <div className="grid gap-4 lg:grid-cols-2">
        {terms.slice(0, 8).map((term) => (
          <GlossaryCard key={term.id} term={term} />
        ))}
      </div>
      <GlossaryTable terms={terms} />
    </div>
  );
}
