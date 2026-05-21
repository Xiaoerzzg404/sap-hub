CREATE TABLE "user_roles" (
	"user_id" uuid NOT NULL,
	"role" "user_role" NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"assigned_by" text DEFAULT 'system' NOT NULL,
	CONSTRAINT "user_roles_user_id_role_pk" PRIMARY KEY("user_id","role")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_hash" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
UPDATE "users"
SET "username" = lower(regexp_replace(split_part("email", '@', 1), '[^a-z0-9_.-]', '-', 'g')) || '-' || substring("id"::text, 1, 6)
WHERE "username" IS NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_username_unique" UNIQUE("username");--> statement-breakpoint
INSERT INTO "user_roles" ("user_id", "role", "assigned_by")
SELECT "id", "role", 'migration:legacy-role'
FROM "users"
ON CONFLICT ("user_id", "role") DO NOTHING;--> statement-breakpoint
UPDATE "users"
SET "username" = 'zzg404',
    "role" = 'admin',
    "updated_at" = now()
WHERE lower("email") = 'zzg404@gmail.com';--> statement-breakpoint
INSERT INTO "user_roles" ("user_id", "role", "assigned_by")
SELECT "id", role_value, 'migration:owner-bootstrap'
FROM "users"
CROSS JOIN (VALUES ('student'::user_role), ('teacher'::user_role), ('admin'::user_role)) AS owner_roles(role_value)
WHERE lower("email") = 'zzg404@gmail.com'
ON CONFLICT ("user_id", "role") DO NOTHING;
