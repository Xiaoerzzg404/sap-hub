import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["student", "teacher", "admin"]);
export const enrollmentStatusEnum = pgEnum("enrollment_status", ["active", "paused", "completed", "dropped"]);
export const assetVisibilityEnum = pgEnum("asset_visibility", ["student", "teacher", "both"]);
export const submissionStatusEnum = pgEnum("submission_status", ["draft", "submitted", "pending-review", "reviewed"]);
export const recordingStatusEnum = pgEnum("recording_status", ["uploading", "ready", "flagged", "deleted"]);
export const practiceTypeEnum = pgEnum("practice_type", [
  "shadowing",
  "micro-training",
  "consultant-output",
  "role-play"
]);
export const progressEventTypeEnum = pgEnum("progress_event_type", [
  "shadowing_done",
  "recording_saved",
  "term_favorited",
  "phrase_favorited",
  "shadowing_favorited",
  "self_assessment_saved",
  "lesson_started",
  "lesson_completed",
  "assignment_submitted",
  "lesson_step_advanced"
]);
export const favoriteKindEnum = pgEnum("favorite_kind", ["term", "phrase", "shadowing"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  name: text("name"),
  image: text("image"),
  role: userRoleEnum("role").notNull().default("student"),
  locale: text("locale").default("zh-CN"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state")
  },
  (table) => [primaryKey({ columns: [table.provider, table.providerAccountId] })]
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull()
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull()
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })]
);

export const classes = pgTable("classes", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  teacherId: uuid("teacher_id").references(() => users.id),
  startsAt: timestamp("starts_at", { mode: "date" }),
  endsAt: timestamp("ends_at", { mode: "date" }),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const enrollments = pgTable(
  "enrollments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: enrollmentStatusEnum("status").notNull().default("active"),
    enrolledAt: timestamp("enrolled_at").defaultNow().notNull()
  },
  (table) => [unique().on(table.classId, table.studentId)]
);

export const lessons = pgTable("lessons", {
  id: text("id").primaryKey(),
  trackId: text("track_id").notNull(),
  level: text("level").notNull(),
  order: integer("order").notNull(),
  title: text("title").notNull(),
  summary: text("summary"),
  sapModules: jsonb("sap_modules").$type<string[]>().default([]),
  projectPhase: jsonb("project_phase").$type<string[]>().default([]),
  japaneseSkillTargets: jsonb("japanese_skill_targets").$type<string[]>().default([]),
  consultantSkillTargets: jsonb("consultant_skill_targets").$type<string[]>().default([]),
  finalOutputTask: text("final_output_task"),
  scenarioMap: jsonb("scenario_map").default([]),
  transcriptMarkdown: text("transcript_markdown"),
  courseDesignMarkdown: text("course_design_markdown"),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const lessonAssets = pgTable("lesson_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  lessonId: text("lesson_id")
    .notNull()
    .references(() => lessons.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  path: text("path").notNull(),
  markdown: text("markdown").notNull(),
  wordCount: integer("word_count").notNull().default(0),
  visibility: assetVisibilityEnum("visibility").notNull().default("both")
});

export const phrases = pgTable("phrases", {
  id: text("id").primaryKey(),
  lessonId: text("lesson_id")
    .notNull()
    .references(() => lessons.id, { onDelete: "cascade" }),
  category: text("category"),
  japanese: text("japanese").notNull(),
  chinese: text("chinese").default(""),
  usage: text("usage"),
  replaceableParts: jsonb("replaceable_parts").$type<string[]>().default([]),
  audioUrl: text("audio_url")
});

export const glossaryTerms = pgTable("glossary_terms", {
  id: text("id").primaryKey(),
  lessonId: text("lesson_id").references(() => lessons.id, { onDelete: "cascade" }),
  chinese: text("chinese"),
  englishOrSap: text("english_or_sap"),
  japanese: text("japanese"),
  reading: text("reading"),
  module: text("module"),
  projectPhase: text("project_phase"),
  scenario: text("scenario"),
  exampleSentence: text("example_sentence"),
  note: text("note"),
  needsReview: boolean("needs_review").default(false)
});

export const shadowingItems = pgTable("shadowing_items", {
  id: text("id").primaryKey(),
  lessonId: text("lesson_id")
    .notNull()
    .references(() => lessons.id, { onDelete: "cascade" }),
  japanese: text("japanese").notNull(),
  chinese: text("chinese").default(""),
  scenario: text("scenario"),
  audioUrl: text("audio_url"),
  requiredRepeats: integer("required_repeats").default(3)
});

export const roleplays = pgTable("roleplays", {
  id: text("id").primaryKey(),
  lessonId: text("lesson_id")
    .notNull()
    .references(() => lessons.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  scenario: text("scenario"),
  roleA: text("role_a"),
  roleB: text("role_b"),
  requiredPhrases: jsonb("required_phrases").$type<string[]>().default([]),
  dialogue: jsonb("dialogue").$type<{ role: "A" | "B"; text: string }[]>().notNull()
});

export const assignments = pgTable("assignments", {
  id: text("id").primaryKey(),
  lessonId: text("lesson_id")
    .notNull()
    .references(() => lessons.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  prompt: text("prompt"),
  targetDurationSec: integer("target_duration_sec")
});

export const assignmentSubmissions = pgTable("assignment_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  assignmentId: text("assignment_id")
    .notNull()
    .references(() => assignments.id),
  studentId: uuid("student_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  recordingId: uuid("recording_id"),
  textContent: text("text_content"),
  selfAssessment: jsonb("self_assessment"),
  status: submissionStatusEnum("status").notNull().default("draft"),
  submittedAt: timestamp("submitted_at", { mode: "date" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const recordings = pgTable("recordings", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  lessonId: text("lesson_id")
    .notNull()
    .references(() => lessons.id),
  practiceType: practiceTypeEnum("practice_type").notNull(),
  promptText: text("prompt_text"),
  targetJapanese: text("target_japanese"),
  storageKey: text("storage_key"),
  mimeType: text("mime_type"),
  durationSec: integer("duration_sec"),
  sizeBytes: integer("size_bytes"),
  selfAssessment: jsonb("self_assessment"),
  status: recordingStatusEnum("status").notNull().default("ready"),
  deletedAt: timestamp("deleted_at", { mode: "date" }),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const teacherFeedback = pgTable(
  "teacher_feedback",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recordingId: uuid("recording_id")
      .notNull()
      .references(() => recordings.id, { onDelete: "cascade" }),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => users.id),
    scoreOverall: integer("score_overall"),
    scoreDim: jsonb("score_dim").$type<{
      pronunciation: number;
      fluency: number;
      naturalness: number;
      sapAccuracy: number;
      consultantLike: number;
    } | null>(),
    comment: text("comment"),
    correctedJapanese: text("corrected_japanese"),
    modelRecordingId: uuid("model_recording_id").references(() => recordings.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
  },
  (table) => [unique().on(table.recordingId)]
);

export const progressEvents = pgTable("progress_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: progressEventTypeEnum("type").notNull(),
  lessonId: text("lesson_id").references(() => lessons.id),
  refId: text("ref_id"),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const favorites = pgTable(
  "favorites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: favoriteKindEnum("kind").notNull(),
    refId: text("ref_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull()
  },
  (table) => [unique().on(table.studentId, table.kind, table.refId)]
);

export const libraryItems = pgTable("library_items", {
  id: text("id").primaryKey(),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  path: text("path").notNull(),
  markdown: text("markdown").notNull(),
  wordCount: integer("word_count").default(0),
  visibility: assetVisibilityEnum("visibility").notNull().default("both")
});

export const reviewTerms = pgTable("review_terms", {
  id: text("id").primaryKey(),
  lessonId: text("lesson_id").references(() => lessons.id),
  rawText: text("raw_text"),
  suggestion: text("suggestion"),
  adoptedJapanese: text("adopted_japanese"),
  reason: text("reason"),
  mustReview: boolean("must_review").default(false),
  status: text("status").default("pending"),
  reviewerId: uuid("reviewer_id").references(() => users.id),
  reviewMemo: text("review_memo"),
  reviewedAt: timestamp("reviewed_at", { mode: "date" })
});
