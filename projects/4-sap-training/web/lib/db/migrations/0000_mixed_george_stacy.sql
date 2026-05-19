CREATE TYPE "public"."asset_visibility" AS ENUM('student', 'teacher', 'both');--> statement-breakpoint
CREATE TYPE "public"."enrollment_status" AS ENUM('active', 'paused', 'completed', 'dropped');--> statement-breakpoint
CREATE TYPE "public"."favorite_kind" AS ENUM('term', 'phrase', 'shadowing');--> statement-breakpoint
CREATE TYPE "public"."practice_type" AS ENUM('shadowing', 'micro-training', 'consultant-output', 'role-play');--> statement-breakpoint
CREATE TYPE "public"."progress_event_type" AS ENUM('shadowing_done', 'recording_saved', 'term_favorited', 'phrase_favorited', 'shadowing_favorited', 'self_assessment_saved', 'lesson_started', 'lesson_completed', 'assignment_submitted', 'lesson_step_advanced');--> statement-breakpoint
CREATE TYPE "public"."recording_status" AS ENUM('uploading', 'ready', 'flagged', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('draft', 'submitted', 'pending-review', 'reviewed');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('student', 'teacher', 'admin');--> statement-breakpoint
CREATE TABLE "accounts" (
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "assignment_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignment_id" text NOT NULL,
	"student_id" uuid NOT NULL,
	"recording_id" uuid,
	"text_content" text,
	"self_assessment" jsonb,
	"status" "submission_status" DEFAULT 'draft' NOT NULL,
	"submitted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"lesson_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"prompt" text,
	"target_duration_sec" integer
);
--> statement-breakpoint
CREATE TABLE "classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"teacher_id" uuid,
	"starts_at" timestamp,
	"ends_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"status" "enrollment_status" DEFAULT 'active' NOT NULL,
	"enrolled_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "enrollments_class_id_student_id_unique" UNIQUE("class_id","student_id")
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"kind" "favorite_kind" NOT NULL,
	"ref_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "favorites_student_id_kind_ref_id_unique" UNIQUE("student_id","kind","ref_id")
);
--> statement-breakpoint
CREATE TABLE "glossary_terms" (
	"id" text PRIMARY KEY NOT NULL,
	"lesson_id" text,
	"chinese" text,
	"english_or_sap" text,
	"japanese" text,
	"reading" text,
	"module" text,
	"project_phase" text,
	"scenario" text,
	"example_sentence" text,
	"note" text,
	"needs_review" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "lesson_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" text NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"path" text NOT NULL,
	"markdown" text NOT NULL,
	"word_count" integer DEFAULT 0 NOT NULL,
	"visibility" "asset_visibility" DEFAULT 'both' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" text PRIMARY KEY NOT NULL,
	"track_id" text NOT NULL,
	"level" text NOT NULL,
	"order" integer NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"sap_modules" jsonb DEFAULT '[]'::jsonb,
	"project_phase" jsonb DEFAULT '[]'::jsonb,
	"japanese_skill_targets" jsonb DEFAULT '[]'::jsonb,
	"consultant_skill_targets" jsonb DEFAULT '[]'::jsonb,
	"final_output_task" text,
	"scenario_map" jsonb DEFAULT '[]'::jsonb,
	"transcript_markdown" text,
	"course_design_markdown" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library_items" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"path" text NOT NULL,
	"markdown" text NOT NULL,
	"word_count" integer DEFAULT 0,
	"visibility" "asset_visibility" DEFAULT 'both' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "phrases" (
	"id" text PRIMARY KEY NOT NULL,
	"lesson_id" text NOT NULL,
	"category" text,
	"japanese" text NOT NULL,
	"chinese" text DEFAULT '',
	"usage" text,
	"replaceable_parts" jsonb DEFAULT '[]'::jsonb,
	"audio_url" text
);
--> statement-breakpoint
CREATE TABLE "progress_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"type" "progress_event_type" NOT NULL,
	"lesson_id" text,
	"ref_id" text,
	"payload" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recordings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"lesson_id" text NOT NULL,
	"practice_type" "practice_type" NOT NULL,
	"prompt_text" text,
	"target_japanese" text,
	"storage_key" text,
	"mime_type" text,
	"duration_sec" integer,
	"size_bytes" integer,
	"self_assessment" jsonb,
	"status" "recording_status" DEFAULT 'ready' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_terms" (
	"id" text PRIMARY KEY NOT NULL,
	"lesson_id" text,
	"raw_text" text,
	"suggestion" text,
	"adopted_japanese" text,
	"reason" text,
	"must_review" boolean DEFAULT false,
	"status" text DEFAULT 'pending',
	"reviewer_id" uuid,
	"review_memo" text,
	"reviewed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "roleplays" (
	"id" text PRIMARY KEY NOT NULL,
	"lesson_id" text NOT NULL,
	"title" text NOT NULL,
	"scenario" text,
	"role_a" text,
	"role_b" text,
	"required_phrases" jsonb DEFAULT '[]'::jsonb,
	"dialogue" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shadowing_items" (
	"id" text PRIMARY KEY NOT NULL,
	"lesson_id" text NOT NULL,
	"japanese" text NOT NULL,
	"chinese" text DEFAULT '',
	"scenario" text,
	"audio_url" text,
	"required_repeats" integer DEFAULT 3
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"email_verified" timestamp,
	"name" text,
	"image" text,
	"role" "user_role" DEFAULT 'student' NOT NULL,
	"locale" text DEFAULT 'zh-CN',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_assignment_id_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "glossary_terms" ADD CONSTRAINT "glossary_terms_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_assets" ADD CONSTRAINT "lesson_assets_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phrases" ADD CONSTRAINT "phrases_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_events" ADD CONSTRAINT "progress_events_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_events" ADD CONSTRAINT "progress_events_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recordings" ADD CONSTRAINT "recordings_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recordings" ADD CONSTRAINT "recordings_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_terms" ADD CONSTRAINT "review_terms_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_terms" ADD CONSTRAINT "review_terms_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roleplays" ADD CONSTRAINT "roleplays_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shadowing_items" ADD CONSTRAINT "shadowing_items_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;