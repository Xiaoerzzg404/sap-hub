import type { Assignment } from "./assignment";
import type { GlossaryTerm } from "./glossary";
import type { Phrase } from "./phrase";

export type ScenarioItem = {
  id: string;
  scene: string;
  sourceCue: string;
  consultantAction: string;
  japaneseTarget: string;
  studentOutput: string;
};

export type ShadowingItem = {
  id: string;
  lessonId: string;
  japanese: string;
  chinese: string;
  scenario: string;
  audioSrc?: string;
  requiredRepeats: number;
};

export type SubstitutionDrill = {
  id: string;
  lessonId: string;
  baseSentence: string;
  replacements: string[];
  prompt: string;
};

export type RolePlayLine = {
  role: "A" | "B";
  text: string;
};

export type RolePlay = {
  id: string;
  lessonId: string;
  title: string;
  scenario: string;
  roleA: string;
  roleB: string;
  requiredPhrases: string[];
  dialogue: RolePlayLine[];
};

export type MicroTraining = {
  id: string;
  lessonId: string;
  title: string;
  prompt: string;
  requiredKeywords: string[];
  durationSec: 30;
};

export type ConsultantOutput = {
  id: string;
  lessonId: string;
  title: string;
  prompt: string;
  durationSec: 60;
  framework: {
    background: string;
    input: string;
    systemAction: string;
    output: string;
    riskIssue: string;
    nextStep: string;
  };
};

export type ReviewItem = {
  id: string;
  lessonId: string;
  rawText: string;
  suggestion: string;
  adoptedJapanese?: string;
  reason: string;
  mustReview: boolean;
  status: "pending" | "reviewed" | "ignored";
  memo?: string;
};

export type Lesson = {
  id: string;
  title: string;
  order: number;
  sourceLessonId: string;
  sapModules: string[];
  projectPhase: string[];
  japaneseSkillTargets: string[];
  consultantSkillTargets: string[];
  finalOutputTask: string;
  summary: string;
  scenarioMap: ScenarioItem[];
  terms: GlossaryTerm[];
  phrases: Phrase[];
  shadowingItems: ShadowingItem[];
  substitutionDrills: SubstitutionDrill[];
  rolePlays: RolePlay[];
  microTrainings: MicroTraining[];
  consultantOutputs: ConsultantOutput[];
  assignments: Assignment[];
  reviewItems: ReviewItem[];
  transcriptMarkdown?: string;
  courseDesignMarkdown?: string;
};
