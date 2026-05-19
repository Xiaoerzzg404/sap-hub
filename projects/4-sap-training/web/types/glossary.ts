export type GlossaryTerm = {
  id: string;
  lessonId: string;
  chinese: string;
  englishOrSap: string;
  japanese: string;
  reading?: string;
  module?: string;
  projectPhase?: string;
  scenario: string;
  exampleSentence: string;
  note?: string;
  needsReview?: boolean;
};
