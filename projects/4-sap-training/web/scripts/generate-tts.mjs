#!/usr/bin/env node
// Batch TTS generator for local SAP Japanese training audio.
// Usage:
//   node scripts/generate-tts.mjs
//   TTS_PROVIDER=skip node scripts/generate-tts.mjs
//
// Credentials live in web/.env.local and must never be committed:
//   AZURE_SPEECH_KEY=...
//   AZURE_SPEECH_REGION=japaneast
//   AZURE_TTS_VOICE=ja-JP-NanamiNeural
// Optional OpenAI fallback:
//   OPENAI_API_KEY=...
// Optional MiniMax provider:
//   MINIMAX_API_KEY=...
//   MINIMAX_TTS_MODEL=speech-2.8-hd
//   MINIMAX_TTS_VOICE=Japanese_GentleButler
//   MINIMAX_JA_VOICE_ID=Japanese_GentleButler
//   TTS_PROVIDER=minimax TTS_OVERWRITE=1 node scripts/generate-tts.mjs
// Resume/retry controls:
//   TTS_LIMIT=10 TTS_START_AFTER_ID=lesson_01-phrase-010 node scripts/generate-tts.mjs
//   TTS_TARGET_IDS_FILE=tmp/tts-remaining-ids.txt node scripts/generate-tts.mjs

import fs from "node:fs";
import path from "node:path";
import { execFile as execFileCallback, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const repoRoot = path.resolve(root, "../../..");
const execFile = promisify(execFileCallback);

function loadEnv() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Z_]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

loadEnv();

const AZURE_KEY = process.env.AZURE_SPEECH_KEY;
const AZURE_REGION = process.env.AZURE_SPEECH_REGION ?? "japaneast";
const AZURE_VOICE = process.env.AZURE_TTS_VOICE ?? "ja-JP-NanamiNeural";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY ?? process.env.MINIMAX_API_TOKEN;
const MINIMAX_API_URL =
  process.env.MINIMAX_API_URL ??
  (process.env.MINIMAX_BASE_URL ? `${process.env.MINIMAX_BASE_URL.replace(/\/$/, "")}/v1/t2a_v2` : "https://api.minimax.io/v1/t2a_v2");
const MINIMAX_MODEL = process.env.MINIMAX_TTS_MODEL ?? "speech-2.8-hd";
const MINIMAX_VOICE = process.env.MINIMAX_TTS_VOICE ?? process.env.MINIMAX_JA_VOICE_ID ?? "Japanese_GentleButler";
const MINIMAX_SPEED = Number(process.env.MINIMAX_TTS_SPEED ?? 1);
const MINIMAX_VOLUME = Number(process.env.MINIMAX_TTS_VOLUME ?? 1);
const MINIMAX_PITCH = Number(process.env.MINIMAX_TTS_PITCH ?? 0);
const MINIMAX_SAMPLE_RATE = Number(process.env.MINIMAX_TTS_SAMPLE_RATE ?? 32000);
const MINIMAX_BITRATE = Number(process.env.MINIMAX_TTS_BITRATE ?? 128000);
const MINIMAX_LANGUAGE_BOOST = process.env.MINIMAX_LANGUAGE_BOOST ?? "Japanese";
const MACOS_VOICE = process.env.MACOS_TTS_VOICE ?? "Kyoko";
const MACOS_RATE = process.env.MACOS_TTS_RATE ?? "175";
const PROVIDER = process.env.TTS_PROVIDER ?? (MINIMAX_API_KEY ? "minimax" : AZURE_KEY ? "azure" : OPENAI_API_KEY ? "openai" : hasCommand("say") ? "macos" : "azure");
const SKIP = PROVIDER === "skip";
const OVERWRITE = ["1", "true", "yes"].includes(String(process.env.TTS_OVERWRITE ?? "").toLowerCase());
const LIMIT = Number(process.env.TTS_LIMIT ?? targetsLimitDefault());
const START_AFTER_ID = process.env.TTS_START_AFTER_ID;
const RETRIES = Number(process.env.TTS_RETRIES ?? (PROVIDER === "minimax" ? 3 : 0));
const RETRY_DELAY_MS = Number(process.env.TTS_RETRY_DELAY_MS ?? 3000);
const MAX_CONSECUTIVE_FAILURES = Number(process.env.TTS_MAX_CONSECUTIVE_FAILURES ?? 20);
const TARGET_IDS = readTargetIds();

if (!providerIsReady()) {
  console.error("ERROR: TTS provider is not ready. Configure credentials, install local tools, or set TTS_PROVIDER=skip.");
  console.error("MiniMax needs MINIMAX_API_KEY. Azure needs AZURE_SPEECH_KEY. OpenAI needs OPENAI_API_KEY. macos needs `say` and `ffmpeg`.");
  process.exit(1);
}

const audioRoot = path.join(root, "public/audio");
const manifestPath = path.join(audioRoot, "audio-manifest.json");
const lessons = readJson("lessons.json");
const phrases = readJson("phrases.json");
const glossary = readJson("glossary.json");
const targets = collectTargets();
const runTargets = selectRunTargets();
const failures = [];

function hasCommand(command) {
  return spawnSync("sh", ["-lc", `command -v ${command}`], { stdio: "ignore" }).status === 0;
}

function providerIsReady() {
  if (SKIP) return true;
  if (PROVIDER === "minimax") return Boolean(MINIMAX_API_KEY);
  if (PROVIDER === "azure") return Boolean(AZURE_KEY);
  if (PROVIDER === "openai") return Boolean(OPENAI_API_KEY);
  if (PROVIDER === "macos") return hasCommand("say") && hasCommand("ffmpeg");
  return false;
}

function targetsLimitDefault() {
  return Number.POSITIVE_INFINITY;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, "data", file), "utf8"));
}

function readTargetIds() {
  const ids = new Set();
  const inlineIds = process.env.TTS_TARGET_IDS ?? "";
  for (const id of inlineIds.split(",")) {
    const trimmed = id.trim();
    if (trimmed) ids.add(trimmed);
  }
  const idsFile = process.env.TTS_TARGET_IDS_FILE;
  if (idsFile) {
    const absPath = path.isAbsolute(idsFile) ? idsFile : path.join(root, idsFile);
    for (const line of fs.readFileSync(absPath, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) ids.add(trimmed);
    }
  }
  return ids;
}

function collectTargets() {
  const out = [];
  for (const phrase of phrases) {
    if (!phrase.japanese) continue;
    out.push({
      id: phrase.id,
      text: phrase.japanese,
      outPath: path.join(audioRoot, "phrase", `${phrase.id}.mp3`),
      audioSrc: `/audio/phrase/${phrase.id}.mp3`,
      lessonId: phrase.lessonId,
      kind: "phrase",
    });
  }
  for (const lesson of lessons) {
    for (const item of lesson.shadowingItems ?? []) {
      if (!item.japanese) continue;
      out.push({
        id: item.id,
        text: item.japanese,
        outPath: path.join(audioRoot, "shadowing", `${item.id}.mp3`),
        audioSrc: `/audio/shadowing/${item.id}.mp3`,
        lessonId: item.lessonId,
        kind: "shadowing",
      });
    }
  }
  for (const term of glossary) {
    if (!term.japanese) continue;
    const followSentence = term.exampleSentence || `${term.japanese}について確認いたします。`;
    out.push({
      id: term.id,
      text: followSentence,
      outPath: path.join(audioRoot, "term", `${term.id}.mp3`),
      audioSrc: `/audio/term/${term.id}.mp3`,
      lessonId: term.lessonId,
      kind: "term",
    });
  }
  return out;
}

function selectRunTargets() {
  let out = targets;
  if (START_AFTER_ID) {
    const startIndex = out.findIndex((target) => target.id === START_AFTER_ID);
    if (startIndex < 0) throw new Error(`TTS_START_AFTER_ID not found: ${START_AFTER_ID}`);
    out = out.slice(startIndex + 1);
  }
  if (TARGET_IDS.size > 0) {
    out = out.filter((target) => TARGET_IDS.has(target.id));
  }
  return out;
}

function ensureAudioDirs() {
  fs.mkdirSync(path.join(audioRoot, "phrase"), { recursive: true });
  fs.mkdirSync(path.join(audioRoot, "shadowing"), { recursive: true });
  fs.mkdirSync(path.join(audioRoot, "term"), { recursive: true });
}

function toSpeechText(text) {
  return text
    .replace(/[、。]\s*\/\s*/g, "、")
    .replace(/\s+\/\s*/g, "、")
    .replace(/\s*\/\s+/g, "、")
    .replace(/\s+/g, " ")
    .replace(/、+/g, "、")
    .trim();
}

function manifestNumber(index) {
  return `AUDIO-${String(index + 1).padStart(4, "0")}`;
}

function buildManifest(statusById = new Map()) {
  return {
    generatedAt: new Date().toISOString(),
    provider: PROVIDER,
    voice:
      PROVIDER === "minimax"
        ? MINIMAX_VOICE
        : PROVIDER === "azure"
          ? AZURE_VOICE
          : PROVIDER === "macos"
            ? MACOS_VOICE
            : process.env.OPENAI_TTS_VOICE ?? "nova",
    model:
      PROVIDER === "minimax"
        ? MINIMAX_MODEL
        : PROVIDER === "openai"
          ? process.env.OPENAI_TTS_MODEL ?? "tts-1"
          : undefined,
    counts: targets.reduce((acc, target) => {
      acc[target.kind] = (acc[target.kind] ?? 0) + 1;
      acc.total += 1;
      return acc;
    }, { total: 0 }),
    targets: targets.map((target, index) => {
      const status = statusById.get(target.id) ?? (fs.existsSync(target.outPath) ? "exists" : "pending");
      return {
        number: manifestNumber(index),
        kind: target.kind,
        id: target.id,
        lessonId: target.lessonId,
        audioSrc: target.audioSrc,
        sourceText: target.text,
        ttsText: toSpeechText(target.text),
        status,
      };
    }),
  };
}

function writeManifest(statusById = new Map()) {
  const manifest = buildManifest(statusById);
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

function writeFileAtomic(outPath, buffer) {
  const tmpPath = `${outPath}.${process.pid}.tmp`;
  fs.writeFileSync(tmpPath, buffer);
  fs.renameSync(tmpPath, outPath);
}

function escapeXml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function azureSynthesize(text, outPath) {
  const tokenRes = await fetch(
    `https://${AZURE_REGION}.api.cognitive.microsoft.com/sts/v1.0/issuetoken`,
    { method: "POST", headers: { "Ocp-Apim-Subscription-Key": AZURE_KEY } }
  );
  if (!tokenRes.ok) throw new Error(`azure token ${tokenRes.status}: ${await tokenRes.text()}`);
  const token = await tokenRes.text();
  const ssml = `<speak version='1.0' xml:lang='ja-JP'><voice name='${AZURE_VOICE}'>${escapeXml(toSpeechText(text))}</voice></speak>`;
  const ttsRes = await fetch(
    `https://${AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
        "User-Agent": "sap-jp-tts",
      },
      body: ssml,
    }
  );
  if (!ttsRes.ok) throw new Error(`azure tts ${ttsRes.status}: ${await ttsRes.text()}`);
  writeFileAtomic(outPath, Buffer.from(await ttsRes.arrayBuffer()));
}

async function openaiSynthesize(text, outPath) {
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_TTS_MODEL ?? "tts-1",
      voice: process.env.OPENAI_TTS_VOICE ?? "nova",
      input: toSpeechText(text),
      response_format: "mp3",
    }),
  });
  if (!res.ok) throw new Error(`openai tts ${res.status}: ${await res.text()}`);
  writeFileAtomic(outPath, Buffer.from(await res.arrayBuffer()));
}

async function minimaxSynthesize(text, outPath) {
  const res = await fetch(MINIMAX_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MINIMAX_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MINIMAX_MODEL,
      text: toSpeechText(text),
      stream: false,
      language_boost: MINIMAX_LANGUAGE_BOOST,
      output_format: "hex",
      voice_setting: {
        voice_id: MINIMAX_VOICE,
        speed: MINIMAX_SPEED,
        vol: MINIMAX_VOLUME,
        pitch: MINIMAX_PITCH,
      },
      audio_setting: {
        sample_rate: MINIMAX_SAMPLE_RATE,
        bitrate: MINIMAX_BITRATE,
        format: "mp3",
        channel: 1,
      },
    }),
  });
  const bodyText = await res.text();
  let body;
  try {
    body = JSON.parse(bodyText);
  } catch {
    body = null;
  }
  if (!res.ok) throw new Error(`minimax tts ${res.status}: ${body?.base_resp?.status_msg ?? bodyText.slice(0, 500)}`);
  if (body?.base_resp?.status_code !== 0) {
    throw new Error(`minimax tts status ${body?.base_resp?.status_code}: ${body?.base_resp?.status_msg ?? "unknown"}`);
  }
  const audioHex = body?.data?.audio;
  if (!audioHex) throw new Error(`minimax tts missing audio: ${bodyText.slice(0, 500)}`);
  writeFileAtomic(outPath, Buffer.from(audioHex, "hex"));
}

async function macosSynthesize(text, outPath) {
  const tmpPath = `${outPath}.${process.pid}.aiff`;
  try {
    await execFile("say", ["-v", MACOS_VOICE, "-r", MACOS_RATE, "-o", tmpPath, toSpeechText(text)]);
    await execFile("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", tmpPath, "-codec:a", "libmp3lame", "-q:a", "3", outPath]);
  } finally {
    fs.rmSync(tmpPath, { force: true });
  }
}

async function synthesize(text, outPath) {
  if (PROVIDER === "minimax") return minimaxSynthesize(text, outPath);
  if (PROVIDER === "azure") return azureSynthesize(text, outPath);
  if (PROVIDER === "openai") return openaiSynthesize(text, outPath);
  if (PROVIDER === "macos") return macosSynthesize(text, outPath);
  throw new Error(`Unsupported TTS_PROVIDER=${PROVIDER}`);
}

async function synthesizeWithRetries(target) {
  let lastError;
  for (let attempt = 0; attempt <= RETRIES; attempt += 1) {
    try {
      await synthesize(target.text, target.outPath);
      return;
    } catch (error) {
      lastError = error;
      if (attempt >= RETRIES) break;
      const delayMs = RETRY_DELAY_MS * (attempt + 1);
      process.stdout.write("r");
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}

function printPlan() {
  const counts = targets.reduce((acc, target) => {
    acc[target.kind] = (acc[target.kind] ?? 0) + 1;
    return acc;
  }, {});
  const runCounts = runTargets.reduce((acc, target) => {
    acc[target.kind] = (acc[target.kind] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`TTS provider=${PROVIDER}${SKIP ? " (dry run only)" : ""}`);
  if (PROVIDER === "minimax") console.log(`MiniMax model=${MINIMAX_MODEL}, voice=${MINIMAX_VOICE}, language=${MINIMAX_LANGUAGE_BOOST}`);
  if (PROVIDER === "macos") console.log(`macOS voice=${MACOS_VOICE}, rate=${MACOS_RATE}`);
  console.log(`Overwrite existing mp3: ${OVERWRITE ? "yes" : "no"}`);
  if (Number.isFinite(LIMIT)) console.log(`Attempt limit: ${LIMIT}`);
  if (START_AFTER_ID) console.log(`Start after id: ${START_AFTER_ID}`);
  if (TARGET_IDS.size > 0) console.log(`Target id filter: ${TARGET_IDS.size} ids`);
  console.log(`Retries per target: ${RETRIES}, retry delay base: ${RETRY_DELAY_MS}ms`);
  console.log(`Target dir: ${audioRoot}`);
  console.log(`Targets: phrase=${counts.phrase ?? 0}, shadowing=${counts.shadowing ?? 0}, term=${counts.term ?? 0}, total=${targets.length}`);
  console.log(`Run targets: phrase=${runCounts.phrase ?? 0}, shadowing=${runCounts.shadowing ?? 0}, term=${runCounts.term ?? 0}, total=${runTargets.length}`);
  for (const target of runTargets.slice(0, 8)) {
    console.log(`- ${target.kind}: ${path.relative(root, target.outPath)} <= ${toSpeechText(target.text)}`);
  }
  if (runTargets.length > 8) console.log(`... ${runTargets.length - 8} more`);
}

async function main() {
  ensureAudioDirs();
  printPlan();
  if (SKIP) {
    writeManifest();
    console.log("TTS_PROVIDER=skip: no network requests sent, no mp3 files written.");
    console.log(`Manifest written at ${manifestPath}`);
    return;
  }

  const statusById = new Map();
  let okCount = 0;
  let skipCount = 0;
  let attemptedCount = 0;
  let consecutiveFailures = 0;
  for (const target of runTargets) {
    if (attemptedCount >= LIMIT) break;
    if (fs.existsSync(target.outPath) && !OVERWRITE) {
      skipCount += 1;
      statusById.set(target.id, "exists");
      continue;
    }
    attemptedCount += 1;
    try {
      await synthesizeWithRetries(target);
      okCount += 1;
      consecutiveFailures = 0;
      statusById.set(target.id, OVERWRITE ? "regenerated" : "generated");
      process.stdout.write(".");
    } catch (error) {
      failures.push({ label: target.id, text: target.text, error: String(error) });
      statusById.set(target.id, "failed");
      consecutiveFailures += 1;
      process.stdout.write("x");
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        console.log(`\nStopped after ${consecutiveFailures} consecutive failures.`);
        break;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, Number(process.env.TTS_THROTTLE_MS ?? 50)));
  }
  console.log("");
  console.log(`Done: attempted=${attemptedCount} ok=${okCount} skip=${skipCount} fail=${failures.length}`);
  writeManifest(statusById);
  console.log(`Manifest written at ${manifestPath}`);

  if (failures.length > 0) {
    const reportPath = path.join(repoRoot, "logs/tts-failures.md");
    fs.writeFileSync(
      reportPath,
      `# TTS 失败记录\n\n${failures.map((f) => `- ${f.label}: ${f.error}\n  \`${f.text}\``).join("\n")}\n`
    );
    console.log(`Failures recorded at ${reportPath}`);
  }
}

main().catch((error) => {
  console.error("Fatal:", error);
  process.exit(1);
});
