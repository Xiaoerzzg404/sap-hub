"use client";

import { useMemo, useState } from "react";
import { allPhrases } from "@/lib/content-loader";
import { PhraseCategoryFilter } from "@/components/phrasebook/PhraseCategoryFilter";
import { PhrasebookTable } from "@/components/phrasebook/PhrasebookTable";

export default function PhrasebookPage() {
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const phrases = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allPhrases
      .filter((phrase) => !category || phrase.category === category)
      .filter((phrase) => !q || [phrase.japanese, phrase.chinese, phrase.usage].join(" ").toLowerCase().includes(q))
      .slice(0, 48);
  }, [category, query]);

  return (
    <div className="page-shell space-y-6">
      <div>
        <p className="text-sm font-semibold text-sap">Phrasebook</p>
        <h1 className="text-2xl font-bold text-ink">项目日语句型库</h1>
      </div>
      <div className="panel grid gap-3 p-4 md:grid-cols-2">
        <input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索日语、中文、场景" />
        <PhraseCategoryFilter value={category} onChange={setCategory} />
      </div>
      <PhrasebookTable phrases={phrases} />
    </div>
  );
}
