export type PhraseCategory =
  | "meeting"
  | "screen-sharing"
  | "requirement-confirmation"
  | "process-explanation"
  | "configuration"
  | "testing"
  | "issue-handling"
  | "scope-management"
  | "next-step"
  | "interview";

export type Phrase = {
  id: string;
  lessonId: string;
  category: PhraseCategory;
  japanese: string;
  chinese: string;
  usage: string;
  replaceableParts: string[];
  exampleVariations: string[];
  audioSrc?: string;
};
