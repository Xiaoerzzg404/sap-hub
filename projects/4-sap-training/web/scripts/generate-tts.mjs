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

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const repoRoot = path.resolve(root, "../../..");

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
const PROVIDER = process.env.TTS_PROVIDER ?? (AZURE_KEY ? "azure" : OPENAI_API_KEY ? "openai" : "azure");
const SKIP = PROVIDER === "skip";

if (!AZURE_KEY && !OPENAI_API_KEY && !SKIP) {
  console.error("ERROR: 凭据缺失。配置 web/.env.local 后重跑，或设置 TTS_PROVIDER=skip 空跑。");
  process.exit(1);
}

const audioRoot = path.join(root, "public/audio");
const lessons = readJson("lessons.json");
const phrases = readJson("phrases.json");
const glossary = readJson("glossary.json");
const targets = collectTargets();
const failures = [];

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, "data", file), "utf8"));
}

function collectTargets() {
  const out = [];
  for (const phrase of phrases) {
    if (!phrase.japanese) continue;
    out.push({
      id: phrase.id,
      text: phrase.japanese,
      outPath: path.join(audioRoot, "phrase", `${phrase.id}.mp3`),
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
        kind: "shadowing",
      });
    }
  }
  for (const term of glossary) {
    if (!term.japanese) continue;
    out.push({
      id: term.id,
      text: term.japanese,
      outPath: path.join(audioRoot, "term", `${term.id}.mp3`),
      kind: "term",
    });
  }
  return out;
}

function ensureAudioDirs() {
  fs.mkdirSync(path.join(audioRoot, "phrase"), { recursive: true });
  fs.mkdirSync(path.join(audioRoot, "shadowing"), { recursive: true });
  fs.mkdirSync(path.join(audioRoot, "term"), { recursive: true });
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
  const ssml = `<speak version='1.0' xml:lang='ja-JP'><voice name='${AZURE_VOICE}'>${escapeXml(text)}</voice></speak>`;
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
  fs.writeFileSync(outPath, Buffer.from(await ttsRes.arrayBuffer()));
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
      input: text,
      response_format: "mp3",
    }),
  });
  if (!res.ok) throw new Error(`openai tts ${res.status}: ${await res.text()}`);
  fs.writeFileSync(outPath, Buffer.from(await res.arrayBuffer()));
}

async function synthesize(text, outPath) {
  if (PROVIDER === "azure") return azureSynthesize(text, outPath);
  if (PROVIDER === "openai") return openaiSynthesize(text, outPath);
  throw new Error(`Unsupported TTS_PROVIDER=${PROVIDER}`);
}

function printPlan() {
  const counts = targets.reduce((acc, target) => {
    acc[target.kind] = (acc[target.kind] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`TTS provider=${PROVIDER}${SKIP ? " (dry run only)" : ""}`);
  console.log(`Target dir: ${audioRoot}`);
  console.log(`Targets: phrase=${counts.phrase ?? 0}, shadowing=${counts.shadowing ?? 0}, term=${counts.term ?? 0}, total=${targets.length}`);
  for (const target of targets.slice(0, 8)) {
    console.log(`- ${target.kind}: ${path.relative(root, target.outPath)} <= ${target.text}`);
  }
  if (targets.length > 8) console.log(`... ${targets.length - 8} more`);
}

async function main() {
  ensureAudioDirs();
  printPlan();
  if (SKIP) {
    console.log("TTS_PROVIDER=skip: no network requests sent, no mp3 files written.");
    return;
  }

  let okCount = 0;
  let skipCount = 0;
  for (const target of targets) {
    if (fs.existsSync(target.outPath)) {
      skipCount += 1;
      continue;
    }
    try {
      await synthesize(target.text, target.outPath);
      okCount += 1;
      process.stdout.write(".");
    } catch (error) {
      failures.push({ label: target.id, text: target.text, error: String(error) });
      process.stdout.write("x");
    }
    await new Promise((resolve) => setTimeout(resolve, Number(process.env.TTS_THROTTLE_MS ?? 50)));
  }
  console.log("");
  console.log(`Done: ok=${okCount} skip=${skipCount} fail=${failures.length}`);

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
