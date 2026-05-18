export type RecordingPracticeType =
  | "shadowing"
  | "micro-training"
  | "consultant-output"
  | "role-play";

export type SelfAssessment = {
  pronunciation: number;
  fluency: number;
  naturalness: number;
  sapAccuracy: number;
  consultantLike: number;
  memo?: string;
};

export type RecordingAttempt = {
  id: string;
  userId: string;
  lessonId: string;
  practiceType: RecordingPracticeType;
  promptText: string;
  targetJapanese?: string;
  audioUrl: string;
  blob?: Blob;
  durationSec: number;
  createdAt: string;
  selfAssessment: SelfAssessment;
  teacherFeedback?: {
    score: number;
    comment: string;
    correctedExpression?: string;
  };
};

export type AudioSentence = {
  id: string;
  lessonId?: string;
  japanese: string;
  chinese: string;
  scenario?: string;
  audioSrc?: string;
};
