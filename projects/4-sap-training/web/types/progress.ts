import type { SelfAssessment } from "./audio";

export type ProgressState = {
  completedLessons: string[];
  completedTerms: string[];
  completedPhrases: string[];
  completedShadowing: string[];
  completedRecordings: string[];
  completedAssignments: string[];
  favoriteTerms: string[];
  favoritePhrases: string[];
  favoriteSentences: string[];
  selfAssessments: Record<string, SelfAssessment>;
  recentStudyAt?: string;
};
