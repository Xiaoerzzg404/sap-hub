#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadEnv() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

loadEnv();

if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL missing in web/.env.local");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(root, "data", `${name}.json`), "utf8"));
}

function chunk(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

async function count(client, table) {
  const result = await client.query(`SELECT COUNT(*)::int AS c FROM ${table}`);
  return result.rows[0].c;
}

async function assertNoUserData(client) {
  const guardedTables = ["users", "recordings", "progress_events", "assignment_submissions", "favorites"];
  const counts = {};
  for (const table of guardedTables) {
    counts[table] = await count(client, table);
  }
  const hasUserData = Object.values(counts).some((value) => value > 0);

  if (hasUserData && process.env.SEED_DB_ALLOW_USER_DATA_RESET !== "yes") {
    console.error("ERROR: seed-db refuses to reset content because user data already exists.", counts);
    console.error("Set SEED_DB_ALLOW_USER_DATA_RESET=yes only for an intentional local reset.");
    process.exit(1);
  }
}

async function insertRows(client, table, columns, rows, chunkSize = 100) {
  if (rows.length === 0) return;

  for (const batch of chunk(rows, chunkSize)) {
    const values = [];
    const tuples = batch.map((row) => {
      const placeholders = row.map((value, index) => {
        values.push(value);
        const cast = columns[index].cast ?? "";
        return `$${values.length}${cast}`;
      });
      return `(${placeholders.join(",")})`;
    });
    await client.query(
      `INSERT INTO ${table} (${columns.map((column) => column.name).join(",")}) VALUES ${tuples.join(",")}`,
      values
    );
  }
}

async function main() {
  const lessons = readJson("lessons");
  const glossary = readJson("glossary");
  const library = readJson("library");
  const reviewTerms = readJson("review-terms");
  const client = await pool.connect();

  try {
    await assertNoUserData(client);
    await client.query("BEGIN");
    console.log("Resetting seeded content tables...");
    await client.query(`
      TRUNCATE TABLE
        review_terms,
        library_items,
        glossary_terms,
        assignments,
        roleplays,
        shadowing_items,
        phrases,
        lesson_assets,
        lessons
      RESTART IDENTITY CASCADE
    `);

    console.log("Seeding lessons...");
    await insertRows(
      client,
      "lessons",
      [
        { name: "id" },
        { name: "track_id" },
        { name: "level" },
        { name: '"order"' },
        { name: "title" },
        { name: "summary" },
        { name: "sap_modules", cast: "::jsonb" },
        { name: "project_phase", cast: "::jsonb" },
        { name: "japanese_skill_targets", cast: "::jsonb" },
        { name: "consultant_skill_targets", cast: "::jsonb" },
        { name: "final_output_task" },
        { name: "scenario_map", cast: "::jsonb" },
        { name: "transcript_markdown" },
        { name: "course_design_markdown" }
      ],
      lessons.map((lesson) => [
        lesson.id,
        lesson.trackId,
        lesson.level,
        lesson.order,
        lesson.title,
        lesson.summary ?? "",
        JSON.stringify(lesson.sapModules ?? []),
        JSON.stringify(lesson.projectPhase ?? []),
        JSON.stringify(lesson.japaneseSkillTargets ?? []),
        JSON.stringify(lesson.consultantSkillTargets ?? []),
        lesson.finalOutputTask ?? "",
        JSON.stringify(lesson.scenarioMap ?? []),
        lesson.transcriptMarkdown ?? "",
        lesson.courseDesignMarkdown ?? ""
      ]),
      50
    );

    console.log("Seeding lesson assets...");
    await insertRows(
      client,
      "lesson_assets",
      [
        { name: "lesson_id" },
        { name: "kind" },
        { name: "title" },
        { name: "path" },
        { name: "markdown" },
        { name: "word_count" },
        { name: "visibility" }
      ],
      lessons.flatMap((lesson) =>
        (lesson.assets ?? []).map((asset) => [
          lesson.id,
          asset.kind,
          asset.title,
          asset.path,
          asset.markdown,
          asset.wordCount ?? 0,
          asset.visibility ?? "both"
        ])
      ),
      25
    );

    console.log("Seeding phrases...");
    await insertRows(
      client,
      "phrases",
      [
        { name: "id" },
        { name: "lesson_id" },
        { name: "category" },
        { name: "japanese" },
        { name: "chinese" },
        { name: "usage" },
        { name: "replaceable_parts", cast: "::jsonb" },
        { name: "audio_url" }
      ],
      lessons.flatMap((lesson) =>
        (lesson.phrases ?? []).map((phrase) => [
          phrase.id,
          lesson.id,
          phrase.category ?? null,
          phrase.japanese,
          phrase.chinese ?? "",
          phrase.usage ?? null,
          JSON.stringify(phrase.replaceableParts ?? []),
          phrase.audioSrc ?? null
        ])
      )
    );

    console.log("Seeding shadowing items...");
    await insertRows(
      client,
      "shadowing_items",
      [
        { name: "id" },
        { name: "lesson_id" },
        { name: "japanese" },
        { name: "chinese" },
        { name: "scenario" },
        { name: "audio_url" },
        { name: "required_repeats" }
      ],
      lessons.flatMap((lesson) =>
        (lesson.shadowingItems ?? []).map((item) => [
          item.id,
          lesson.id,
          item.japanese,
          item.chinese ?? "",
          item.scenario ?? null,
          item.audioSrc ?? null,
          item.requiredRepeats ?? 3
        ])
      )
    );

    console.log("Seeding roleplays...");
    await insertRows(
      client,
      "roleplays",
      [
        { name: "id" },
        { name: "lesson_id" },
        { name: "title" },
        { name: "scenario" },
        { name: "role_a" },
        { name: "role_b" },
        { name: "required_phrases", cast: "::jsonb" },
        { name: "dialogue", cast: "::jsonb" }
      ],
      lessons.flatMap((lesson) =>
        (lesson.rolePlays ?? []).map((roleplay) => [
          roleplay.id,
          lesson.id,
          roleplay.title,
          roleplay.scenario ?? null,
          roleplay.roleA ?? null,
          roleplay.roleB ?? null,
          JSON.stringify(roleplay.requiredPhrases ?? []),
          JSON.stringify(roleplay.dialogue ?? [])
        ])
      )
    );

    console.log("Seeding assignments...");
    await insertRows(
      client,
      "assignments",
      [
        { name: "id" },
        { name: "lesson_id" },
        { name: "type" },
        { name: "title" },
        { name: "prompt" },
        { name: "target_duration_sec" }
      ],
      lessons.flatMap((lesson) =>
        (lesson.assignments ?? []).map((assignment) => [
          assignment.id,
          lesson.id,
          assignment.type,
          assignment.title,
          assignment.prompt ?? null,
          assignment.targetDurationSec ?? null
        ])
      )
    );

    console.log("Seeding glossary terms...");
    await insertRows(
      client,
      "glossary_terms",
      [
        { name: "id" },
        { name: "lesson_id" },
        { name: "chinese" },
        { name: "english_or_sap" },
        { name: "japanese" },
        { name: "reading" },
        { name: "module" },
        { name: "project_phase" },
        { name: "scenario" },
        { name: "example_sentence" },
        { name: "note" },
        { name: "needs_review" }
      ],
      glossary.map((term) => [
        term.id,
        term.lessonId ?? null,
        term.chinese ?? null,
        term.englishOrSap ?? null,
        term.japanese ?? null,
        term.reading ?? null,
        term.module ?? null,
        term.projectPhase ?? null,
        term.scenario ?? null,
        term.exampleSentence ?? null,
        term.note ?? null,
        !!term.needsReview
      ])
    );

    console.log("Seeding library items...");
    await insertRows(
      client,
      "library_items",
      [
        { name: "id" },
        { name: "kind" },
        { name: "title" },
        { name: "path" },
        { name: "markdown" },
        { name: "word_count" },
        { name: "visibility" }
      ],
      library.map((item) => [
        item.kind,
        item.kind,
        item.title,
        item.path,
        item.markdown,
        item.wordCount ?? 0,
        item.visibility ?? "both"
      ])
    );

    console.log("Seeding review terms...");
    await insertRows(
      client,
      "review_terms",
      [
        { name: "id" },
        { name: "lesson_id" },
        { name: "raw_text" },
        { name: "suggestion" },
        { name: "adopted_japanese" },
        { name: "reason" },
        { name: "must_review" },
        { name: "status" },
        { name: "review_memo" }
      ],
      reviewTerms.map((item) => [
        item.id,
        item.lessonId ?? null,
        item.rawText ?? null,
        item.suggestion ?? null,
        item.adoptedJapanese ?? null,
        item.reason ?? null,
        !!item.mustReview,
        item.status ?? "pending",
        item.memo ?? null
      ])
    );

    await client.query("COMMIT");

    const counts = {
      lessons: await count(client, "lessons"),
      phrases: await count(client, "phrases"),
      shadowing_items: await count(client, "shadowing_items"),
      roleplays: await count(client, "roleplays"),
      lesson_assets: await count(client, "lesson_assets"),
      glossary_terms: await count(client, "glossary_terms"),
      library_items: await count(client, "library_items"),
      assignments: await count(client, "assignments"),
      review_terms: await count(client, "review_terms")
    };
    console.log("Done. Counts:", counts);

    const expected = {
      lessons: 24,
      phrases: 480,
      shadowing_items: 480,
      roleplays: 48,
      lesson_assets: 240,
      glossary_terms: 528,
      library_items: 6
    };
    const mismatches = Object.entries(expected).filter(([key, value]) => counts[key] !== value);
    if (mismatches.length > 0) {
      console.error("ERROR: seed counts mismatch", Object.fromEntries(mismatches));
      process.exitCode = 1;
    }
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
