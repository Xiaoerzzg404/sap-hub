"use client";

import type { ProgressState } from "@/types/progress";

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
  favoriteSentences: [],
  selfAssessments: {}
};

export function loadProgress(): ProgressState {
  if (typeof window === "undefined") return defaultProgress;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...defaultProgress, ...JSON.parse(raw) } : defaultProgress;
  } catch {
    return defaultProgress;
  }
}

export function saveProgress(progress: ProgressState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify({ ...progress, recentStudyAt: new Date().toISOString() }));
}

export function toggleProgressList(key: keyof ProgressState, id: string) {
  const progress = loadProgress();
  const current = progress[key];
  if (!Array.isArray(current)) return progress;
  const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
  const updated = { ...progress, [key]: next, recentStudyAt: new Date().toISOString() };
  saveProgress(updated);
  return updated;
}

export function markProgress(key: keyof ProgressState, id: string) {
  const progress = loadProgress();
  const current = progress[key];
  if (!Array.isArray(current)) return progress;
  const updated = current.includes(id)
    ? progress
    : { ...progress, [key]: [...current, id], recentStudyAt: new Date().toISOString() };
  saveProgress(updated);
  return updated;
}
