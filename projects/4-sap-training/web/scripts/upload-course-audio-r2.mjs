import { createHash } from "crypto";
import { createReadStream, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");
const envPath = path.join(webRoot, ".env.local");
const audioRoot = path.join(webRoot, "public", "audio");
const manifestPath = path.join(audioRoot, "audio-manifest.json");
const reportDir = path.join(webRoot, "ops", "site-ledger", "reports");
const defaultPrefix = "course-audio/20260521";

loadEnvFile(envPath);

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const writeReport = args.has("--write-report");
const prefix = readArg("--prefix") ?? process.env.COURSE_AUDIO_R2_PREFIX ?? defaultPrefix;
const normalizedPrefix = prefix.replace(/^\/+|\/+$/g, "");

const requiredEnv = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME"];
const missing = requiredEnv.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`ERROR: missing required env: ${missing.join(", ")}`);
  process.exit(1);
}

if (!existsSync(audioRoot)) {
  console.error("ERROR: public/audio directory missing");
  process.exit(1);
}

const files = findMp3Files(audioRoot);
if (files.length === 0) {
  console.error("ERROR: no mp3 files found under public/audio");
  process.exit(1);
}

const client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  }
});

const report = {
  uploadedAt: new Date().toISOString(),
  dryRun,
  bucketConfigured: true,
  publicBaseEnv: "NEXT_PUBLIC_COURSE_AUDIO_BASE_URL",
  publicBaseConfigured: Boolean(process.env.NEXT_PUBLIC_COURSE_AUDIO_BASE_URL),
  prefix: normalizedPrefix,
  counts: { total: files.length, uploaded: 0, failed: 0 },
  bytes: 0,
  sampleKeys: []
};

const concurrency = Number(process.env.COURSE_AUDIO_UPLOAD_CONCURRENCY ?? 8);
let cursor = 0;

await Promise.all(
  Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (cursor < files.length) {
      const file = files[cursor++];
      await uploadOne(file);
    }
  })
);

if (!dryRun && existsSync(manifestPath)) {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  manifest.delivery = {
    strategy: "cloudflare-r2-cdn",
    basePathEnv: "NEXT_PUBLIC_COURSE_AUDIO_BASE_URL",
    fallbackBasePath: "/audio",
    r2KeyPrefix: normalizedPrefix,
    uploadedAt: report.uploadedAt,
    mp3GitPolicy: "mp3 files stay gitignored; do not force-add course audio"
  };
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

if (writeReport) {
  const reportPath = path.join(
    reportDir,
    `${report.uploadedAt.replace(/[:.]/g, "-")}__r2-course-audio-upload.json`
  );
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`report=${path.relative(webRoot, reportPath)}`);
}

console.log(
  JSON.stringify(
    {
      dryRun: report.dryRun,
      prefix: report.prefix,
      total: report.counts.total,
      uploaded: report.counts.uploaded,
      failed: report.counts.failed,
      bytes: report.bytes,
      publicBaseConfigured: report.publicBaseConfigured
    },
    null,
    2
  )
);

if (report.counts.failed > 0) process.exit(1);

async function uploadOne(file) {
  const rel = path.relative(audioRoot, file).split(path.sep).join("/");
  const key = `${normalizedPrefix}/${rel}`;
  const size = statSync(file).size;
  report.bytes += size;
  if (report.sampleKeys.length < 5) report.sampleKeys.push(key);
  if (dryRun) {
    report.counts.uploaded += 1;
    return;
  }
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: createReadStream(file),
        ContentType: "audio/mpeg",
        CacheControl: "public, max-age=31536000, immutable",
        ChecksumSHA256: createHash("sha256").update(readFileSync(file)).digest("base64")
      })
    );
    report.counts.uploaded += 1;
  } catch (error) {
    report.counts.failed += 1;
    console.error(`upload_failed key=${key} error=${error.name ?? "Error"}:${error.message}`);
  }
}

function findMp3Files(root) {
  const result = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) result.push(...findMp3Files(fullPath));
    if (entry.isFile() && entry.name.endsWith(".mp3")) result.push(fullPath);
  }
  return result.sort();
}

function readArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function loadEnvFile(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
  }
}
