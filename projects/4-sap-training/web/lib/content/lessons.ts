import "server-only";

import { and, asc, eq } from "drizzle-orm";
import fallbackAssignments from "@/data/assignments.json";
import fallbackGlossary from "@/data/glossary.json";
import fallbackLibrary from "@/data/library.json";
import fallbackLessons from "@/data/lessons.json";
import fallbackPhrases from "@/data/phrases.json";
import fallbackReviewTerms from "@/data/review-terms.json";
import fallbackRoleplays from "@/data/roleplays.json";
import { db } from "@/lib/db";
import {
  assignments,
  glossaryTerms,
  lessonAssets,
  lessons,
  libraryItems,
  phrases,
  reviewTerms,
  roleplays,
  shadowingItems
} from "@/lib/db/schema";
import type { Assignment } from "@/types/assignment";
import type { GlossaryTerm } from "@/types/glossary";
import type { LibraryItem } from "@/types/library";
import type { Lesson, LessonAsset, ReviewItem, RolePlay, ShadowingItem } from "@/types/lesson";
import type { Phrase } from "@/types/phrase";

const fallbackById = new Map((fallbackLessons as Lesson[]).map((lesson) => [lesson.id, lesson]));
const useStaticFallback =
  process.env.CI === "true" || process.env.DATABASE_URL?.includes("mock@localhost") === true;

type LessonRow = typeof lessons.$inferSelect;
type LessonAssetRow = typeof lessonAssets.$inferSelect;
type PhraseRow = typeof phrases.$inferSelect;
type ShadowingRow = typeof shadowingItems.$inferSelect;
type RoleplayRow = typeof roleplays.$inferSelect;
type AssignmentRow = typeof assignments.$inferSelect;
type GlossaryRow = typeof glossaryTerms.$inferSelect;
type ReviewTermRow = typeof reviewTerms.$inferSelect;
type LibraryItemRow = typeof libraryItems.$inferSelect;

function baseLesson(row: LessonRow): Lesson {
  const fallback = fallbackById.get(row.id);
  return {
    id: row.id,
    title: row.title,
    order: row.order,
    trackId: row.trackId as Lesson["trackId"],
    level: row.level as Lesson["level"],
    assets: [],
    sourceLessonId: fallback?.sourceLessonId ?? row.id,
    sapModules: row.sapModules ?? [],
    projectPhase: row.projectPhase ?? [],
    japaneseSkillTargets: row.japaneseSkillTargets ?? [],
    consultantSkillTargets: row.consultantSkillTargets ?? [],
    finalOutputTask: row.finalOutputTask ?? "",
    summary: row.summary ?? "",
    scenarioMap: row.scenarioMap as Lesson["scenarioMap"],
    terms: [],
    phrases: [],
    shadowingItems: [],
    substitutionDrills: fallback?.substitutionDrills ?? [],
    rolePlays: [],
    microTrainings: fallback?.microTrainings ?? [],
    consultantOutputs: fallback?.consultantOutputs ?? [],
    assignments: [],
    reviewItems: fallback?.reviewItems ?? [],
    transcriptMarkdown: row.transcriptMarkdown ?? "",
    courseDesignMarkdown: row.courseDesignMarkdown ?? ""
  };
}

function toAsset(row: LessonAssetRow): LessonAsset {
  return {
    kind: row.kind as LessonAsset["kind"],
    title: row.title,
    path: row.path,
    markdown: "",
    wordCount: row.wordCount,
    visibility: row.visibility
  };
}

function toPhrase(row: PhraseRow): Phrase {
  return {
    id: row.id,
    lessonId: row.lessonId,
    category: row.category as Phrase["category"],
    japanese: row.japanese,
    chinese: row.chinese ?? "",
    usage: row.usage ?? "",
    replaceableParts: row.replaceableParts ?? [],
    exampleVariations: [],
    audioSrc: row.audioUrl ?? undefined
  };
}

function toShadowingItem(row: ShadowingRow): ShadowingItem {
  return {
    id: row.id,
    lessonId: row.lessonId,
    japanese: row.japanese,
    chinese: row.chinese ?? "",
    scenario: row.scenario ?? "",
    audioSrc: row.audioUrl ?? undefined,
    requiredRepeats: row.requiredRepeats ?? 3
  };
}

function toRoleplay(row: RoleplayRow): RolePlay {
  return {
    id: row.id,
    lessonId: row.lessonId,
    title: row.title,
    scenario: row.scenario ?? "",
    roleA: row.roleA ?? "",
    roleB: row.roleB ?? "",
    requiredPhrases: row.requiredPhrases ?? [],
    dialogue: row.dialogue
  };
}

function toAssignment(row: AssignmentRow): Assignment {
  return {
    id: row.id,
    lessonId: row.lessonId,
    type: row.type as Assignment["type"],
    title: row.title,
    prompt: row.prompt ?? ""
  };
}

function toGlossaryTerm(row: GlossaryRow): GlossaryTerm {
  return {
    id: row.id,
    lessonId: row.lessonId ?? "",
    chinese: row.chinese ?? "",
    englishOrSap: row.englishOrSap ?? "",
    japanese: row.japanese ?? "",
    reading: row.reading ?? undefined,
    module: row.module ?? undefined,
    projectPhase: row.projectPhase ?? undefined,
    scenario: row.scenario ?? "",
    exampleSentence: row.exampleSentence ?? "",
    note: row.note ?? undefined,
    needsReview: row.needsReview ?? false
  };
}

function toReviewTerm(row: ReviewTermRow): ReviewItem {
  return {
    id: row.id,
    lessonId: row.lessonId ?? "",
    rawText: row.rawText ?? "",
    suggestion: row.suggestion ?? "",
    adoptedJapanese: row.adoptedJapanese ?? undefined,
    reason: row.reason ?? "",
    mustReview: row.mustReview ?? false,
    status: (row.status ?? "pending") as ReviewItem["status"],
    memo: row.reviewMemo ?? undefined
  };
}

function toLibraryItem(row: LibraryItemRow): LibraryItem {
  return {
    kind: row.kind as LibraryItem["kind"],
    title: row.title,
    path: row.path,
    markdown: "",
    wordCount: row.wordCount ?? 0,
    visibility: row.visibility
  };
}

export async function getAllLessons() {
  if (useStaticFallback) return fallbackLessons as Lesson[];
  const rows = await db.select().from(lessons).orderBy(asc(lessons.order));
  return rows.map(baseLesson);
}

export async function getNextLesson(id: string) {
  const all = await getAllLessons();
  const index = all.findIndex((lesson) => lesson.id === id);
  return index >= 0 ? all[index + 1] : undefined;
}

export async function getLessonById(id: string) {
  if (useStaticFallback) return fallbackById.get(id) ?? null;
  const [row] = await db.select().from(lessons).where(eq(lessons.id, id));
  if (!row) return null;

  const [assetRows, phraseRows, shadowingRows, roleplayRows, assignmentRows, termRows] = await Promise.all([
    db.select().from(lessonAssets).where(eq(lessonAssets.lessonId, id)),
    db.select().from(phrases).where(eq(phrases.lessonId, id)),
    db.select().from(shadowingItems).where(eq(shadowingItems.lessonId, id)),
    db.select().from(roleplays).where(eq(roleplays.lessonId, id)),
    db.select().from(assignments).where(eq(assignments.lessonId, id)),
    db.select().from(glossaryTerms).where(eq(glossaryTerms.lessonId, id))
  ]);

  return {
    ...baseLesson(row),
    assets: assetRows.map(toAsset),
    phrases: phraseRows.map(toPhrase),
    shadowingItems: shadowingRows.map(toShadowingItem),
    rolePlays: roleplayRows.map(toRoleplay),
    assignments: assignmentRows.map(toAssignment),
    terms: termRows.map(toGlossaryTerm)
  };
}

export async function getAllLessonsWithContent() {
  if (useStaticFallback) return fallbackLessons as Lesson[];
  const summaries = await getAllLessons();
  const fullLessons = await Promise.all(summaries.map((lesson) => getLessonById(lesson.id)));
  return fullLessons.filter((lesson): lesson is Lesson => Boolean(lesson));
}

export async function getReviewTerms() {
  if (useStaticFallback) return fallbackReviewTerms as ReviewItem[];
  const rows = await db.select().from(reviewTerms);
  return rows.map(toReviewTerm);
}

export async function getLibraryItems() {
  if (useStaticFallback) return fallbackLibrary as LibraryItem[];
  const rows = await db.select().from(libraryItems);
  return rows.map(toLibraryItem);
}

export async function getLibraryItemByKind(kind: string) {
  if (useStaticFallback) {
    return (fallbackLibrary as LibraryItem[]).find((item) => item.kind === kind) ?? null;
  }
  const [row] = await db.select().from(libraryItems).where(eq(libraryItems.kind, kind));
  return row ? { ...toLibraryItem(row), markdown: row.markdown } : null;
}

export async function getLessonAssetByKind(lessonId: string, kind: string) {
  if (useStaticFallback) {
    const lesson = fallbackById.get(lessonId);
    return lesson?.assets?.find((asset) => asset.kind === kind) ?? null;
  }
  const [row] = await db
    .select()
    .from(lessonAssets)
    .where(and(eq(lessonAssets.lessonId, lessonId), eq(lessonAssets.kind, kind)));
  return row ? { ...toAsset(row), markdown: row.markdown } : null;
}

export async function getGlossaryTerms() {
  if (useStaticFallback) return fallbackGlossary as GlossaryTerm[];
  const rows = await db.select().from(glossaryTerms);
  return rows.map(toGlossaryTerm);
}

export async function getPhrases() {
  if (useStaticFallback) return fallbackPhrases as Phrase[];
  const rows = await db.select().from(phrases);
  return rows.map(toPhrase);
}

export async function getRoleplays() {
  if (useStaticFallback) return fallbackRoleplays as RolePlay[];
  const rows = await db.select().from(roleplays);
  return rows.map(toRoleplay);
}

export async function getAssignments() {
  if (useStaticFallback) return fallbackAssignments as Assignment[];
  const rows = await db.select().from(assignments);
  return rows.map(toAssignment);
}
