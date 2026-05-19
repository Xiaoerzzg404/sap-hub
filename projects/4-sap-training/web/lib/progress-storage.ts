"use client";

import type { ProgressState } from "@/types/progress";
import type { SelfAssessment } from "@/types/audio";

const KEY = "sap-jp-speaking-progress-v1";

type ProgressListKey =
  | "completedLessons"
  | "completedTerms"
  | "completedPhrases"
  | "completedShadowing"
  | "completedRecordings"
  | "completedAssignments"
  | "favoriteTerms"
  | "favoritePhrases"
  | "favoriteShadowing";

type ProgressEvent = {
  id: string;
  type: string;
  lessonId?: string | null;
  refId?: string | null;
  payload?: Record<string, unknown> | null;
  createdAt: string;
};

export const defaultProgress: ProgressState = {
  completedLessons: [],
  completedTerms: [],
  completedPhrases: [],
  completedShadowing: [],
  completedRecordings: [],
  completedAssignments: [],
  favoriteTerms: [],
  favoritePhrases: [],
  favoriteShadowing: [],
  selfAssessments: {},
  lessonStep: {}
};

function localProgress(): ProgressState {
  if (typeof window === "undefined") return defaultProgress;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultProgress;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.favoriteSentences)) {
      parsed.favoriteShadowing = [
        ...new Set([...(parsed.favoriteShadowing ?? []), ...parsed.favoriteSentences])
      ];
      delete parsed.favoriteSentences;
    }
    return { ...defaultProgress, ...parsed };
  } catch {
    return defaultProgress;
  }
}

export function saveProgress(progress: ProgressState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify({ ...progress, recentStudyAt: new Date().toISOString() }));
}

function addUnique(list: string[], id: string) {
  return list.includes(id) ? list : [...list, id];
}

function removeItem(list: string[], id: string) {
  return list.filter((item) => item !== id);
}

function listEventType(key: ProgressListKey) {
  const mapping: Record<ProgressListKey, string> = {
    completedLessons: "lesson_completed",
    completedTerms: "term_favorited",
    completedPhrases: "phrase_favorited",
    completedShadowing: "shadowing_done",
    completedRecordings: "recording_saved",
    completedAssignments: "assignment_submitted",
    favoriteTerms: "term_favorited",
    favoritePhrases: "phrase_favorited",
    favoriteShadowing: "shadowing_favorited"
  };
  return mapping[key];
}

function lessonIdFromRef(refId: string) {
  const match = refId.match(/^(lesson_\d{2})/);
  return match?.[1] ?? null;
}

async function postProgressEvent(event: {
  type: string;
  lessonId?: string | null;
  refId?: string | null;
  payload?: Record<string, unknown>;
}) {
  try {
    await fetch("/api/progress/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event)
    });
  } catch {
    // localStorage remains the offline cache if the network or session is unavailable.
  }
}

function applyEvent(progress: ProgressState, event: ProgressEvent): ProgressState {
  const payload = event.payload ?? {};
  const refId = event.refId ?? "";
  const key = payload.key as ProgressListKey | undefined;
  const action = payload.action === "remove" ? "remove" : "add";

  if (key && Array.isArray(progress[key]) && refId) {
    return {
      ...progress,
      [key]: action === "remove" ? removeItem(progress[key], refId) : addUnique(progress[key], refId),
      recentStudyAt: event.createdAt
    } as ProgressState;
  }

  if (event.type === "self_assessment_saved" && refId) {
    return {
      ...progress,
      selfAssessments: {
        ...progress.selfAssessments,
        [refId]: payload.score as SelfAssessment
      },
      recentStudyAt: event.createdAt
    };
  }

  if (event.type === "lesson_step_advanced" && event.lessonId) {
    return {
      ...progress,
      lessonStep: {
        ...(progress.lessonStep ?? {}),
        [event.lessonId]: Number(payload.stepIndex ?? 0)
      },
      recentStudyAt: event.createdAt
    };
  }

  return progress;
}

function progressFromEvents(events: ProgressEvent[]) {
  return events
    .slice()
    .reverse()
    .reduce((progress, event) => applyEvent(progress, event), { ...defaultProgress });
}

export async function loadProgress(): Promise<ProgressState> {
  if (typeof window === "undefined") return defaultProgress;
  try {
    const response = await fetch("/api/progress/events", { cache: "no-store" });
    if (!response.ok) return localProgress();
    const data = await response.json();
    const progress = progressFromEvents(data.events ?? []);
    saveProgress(progress);
    return progress;
  } catch {
    return localProgress();
  }
}

export async function toggleProgressList<K extends ProgressListKey>(key: K, id: string) {
  const progress = localProgress();
  const current = progress[key];
  const action = current.includes(id) ? "remove" : "add";
  const next = action === "remove" ? removeItem(current, id) : [...current, id];
  const updated = { ...progress, [key]: next, recentStudyAt: new Date().toISOString() } as ProgressState;
  saveProgress(updated);
  await postProgressEvent({
    type: listEventType(key),
    lessonId: lessonIdFromRef(id),
    refId: id,
    payload: { key, action }
  });
  return updated;
}

export async function markProgress<K extends ProgressListKey>(key: K, id: string) {
  const progress = localProgress();
  const current = progress[key];
  const updated = current.includes(id)
    ? progress
    : ({ ...progress, [key]: [...current, id], recentStudyAt: new Date().toISOString() } as ProgressState);
  saveProgress(updated);
  await postProgressEvent({
    type: listEventType(key),
    lessonId: lessonIdFromRef(id),
    refId: id,
    payload: { key, action: "add" }
  });
  return updated;
}

export async function setSelfAssessment(recordingId: string, score: SelfAssessment) {
  const progress = localProgress();
  const updated = {
    ...progress,
    selfAssessments: { ...progress.selfAssessments, [recordingId]: score },
    recentStudyAt: new Date().toISOString()
  };
  saveProgress(updated);
  await postProgressEvent({
    type: "self_assessment_saved",
    lessonId: lessonIdFromRef(recordingId),
    refId: recordingId,
    payload: { score }
  });
  return updated;
}

export async function setLessonStep(lessonId: string, stepIndex: number) {
  const progress = localProgress();
  const lessonStep = { ...(progress.lessonStep ?? {}), [lessonId]: stepIndex };
  const updated = { ...progress, lessonStep, recentStudyAt: new Date().toISOString() };
  saveProgress(updated);
  await postProgressEvent({
    type: "lesson_step_advanced",
    lessonId,
    refId: lessonId,
    payload: { stepIndex }
  });
  return updated;
}
