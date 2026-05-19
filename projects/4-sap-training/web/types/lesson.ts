import type { Assignment } from "./assignment";
import type { GlossaryTerm } from "./glossary";
import type { Phrase } from "./phrase";
import type { TrackId, LevelId } from "./track";

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

export type LessonAssetKind =
  | "course-design"           // 01_单课课程设计稿/lesson_XX_*.md
  | "classroom-transcript"    // 02_单课日语课堂逐字稿/lesson_XX_*.md
  | "practice-homework"       // 03_单课练习与作业/lesson_XX_*.md
  | "review-checklist"        // 09_待复核清单/lesson_XX_*.md
  | "teacher-script-v4"       // v4 teacher_core/01_teacher_full_script_slide_by_slide.md
  | "student-ppt-v4"          // v4 student_materials/01_student_ppt_outline_final.md
  | "classroom-workbook-v4"   // v4 classroom_practice/01_classroom_workbook_roleplay.md
  | "case-pack-v4"            // v4 case_pack/01_case_pack_appendix_all_modules.md
  | "quality-check-v4"        // v4 management/02_quality_check_teacher_usability.md
  | "package-readme";         // 11_24课独立课程包/lesson_XX/00_README_*.md

export type LessonAsset = {
  kind: LessonAssetKind;
  title: string;          // 显示用标题
  path: string;           // 相对 sap-hub 仓库根的路径，便于追溯
  markdown: string;       // md 原文（转换时一次性读入；后续 Phase 2 渲染用）
  wordCount: number;      // 字符数（非词数，按 UTF-16 单元计）
  visibility: "student" | "teacher" | "both";
};

export type Lesson = {
  id: string;
  title: string;
  order: number;
  // ↓↓↓ Phase 1 新增 ↓↓↓
  trackId: TrackId;
  level: LevelId;
  assets: LessonAsset[];
  // ↑↑↑ Phase 1 新增 ↑↑↑
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
