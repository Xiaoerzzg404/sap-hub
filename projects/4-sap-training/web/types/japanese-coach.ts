export type RoutinePhrase = {
  japanese: string;
  chinese: string;
  usage: string;
};

export type TeachingPrinciple = {
  title: string;
  rule: string;
  teacherMustSay: string;
};

export type ForbiddenHabit = {
  habit: string;
  whyItHurts: string;
  replacement: string;
};

export type ClassFlowStep = {
  minutes: string;
  name: string;
  teacherAction: string;
  studentOutput: string;
  passCheck: string;
};

export type FeedbackRubricItem = {
  dimension: string;
  pass: string;
  danger: string;
  coachLine: string;
};

export type GrammarNote = {
  title: string;
  pattern: string;
  explanation: string;
  commonMistake: string;
  betterExpression: string;
};

export type DialogueLine = {
  role: "customer" | "consultant";
  japanese: string;
  chinese: string;
};

export type RewriteChallenge = {
  ng: string;
  hint: string;
  answer: string;
};

export type JapaneseCoachEntry = {
  lessonId: string;
  scenarioLabel: string;
  teacherMission?: string;
  corePattern: {
    title: string;
    flow: string[];
    teacherNote: string;
  };
  grammarNotes?: GrammarNote[];
  routinePhrases?: RoutinePhrase[];
  miniDialogue: {
    title: string;
    lines: DialogueLine[];
  };
  shortReading?: {
    title: string;
    japanese: string;
    chinese: string;
  };
  rewriteChallenges: RewriteChallenge[];
  outputTask: {
    prompt: string;
    modelFrame: string;
  };
  checklist: string[];
};

export type JapaneseCoachData = {
  updatedBy: string;
  updatedAt: string;
  teachingPrinciples: TeachingPrinciple[];
  forbiddenHabits: ForbiddenHabit[];
  classFlow: ClassFlowStep[];
  feedbackRubric: FeedbackRubricItem[];
  grammarNotes: GrammarNote[];
  routinePhrases: RoutinePhrase[];
  lessonEntries: JapaneseCoachEntry[];
};
