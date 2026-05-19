"use client";

import type { ProgressState } from "@/types/progress";
import type { SelfAssessment } from "@/types/audio";

const KEY = "sap-jp-speaking-progress-v1";

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

export function loadProgress(): ProgressState {
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

export function toggleProgressList<K extends keyof ProgressState>(key: K, id: string) {
  const progress = loadProgress();
  const current = progress[key];
  if (!Array.isArray(current)) return progress;
  const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
  const updated = { ...progress, [key]: next, recentStudyAt: new Date().toISOString() } as ProgressState;
  saveProgress(updated);
  return updated;
}

export function markProgress<K extends keyof ProgressState>(key: K, id: string) {
  const progress = loadProgress();
  const current = progress[key];
  if (!Array.isArray(current)) return progress;
  const updated = current.includes(id)
    ? progress
    : ({ ...progress, [key]: [...current, id], recentStudyAt: new Date().toISOString() } as ProgressState);
  saveProgress(updated);
  return updated;
}

export function setSelfAssessment(recordingId: string, score: SelfAssessment) {
  const progress = loadProgress();
  const updated = {
    ...progress,
    selfAssessments: { ...progress.selfAssessments, [recordingId]: score },
    recentStudyAt: new Date().toISOString()
  };
  saveProgress(updated);
  return updated;
}
