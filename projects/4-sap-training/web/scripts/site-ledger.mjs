#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(scriptDir, "..");
const projectRoot = path.resolve(webRoot, "..");
const repoRoot = path.resolve(projectRoot, "../..");
const configPath = path.join(webRoot, "ops/site-ledger/config.json");
const config = readJson(configPath);

const textExtensions = new Set([
  ".css",
  ".csv",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".sql",
  ".ts",
  ".tsx",
  ".txt",
  ".yaml",
  ".yml",
]);

const ignoredDirNames = new Set([".git", ".next", "node_modules", "coverage", "dist"]);
const ignoredBinaryExtensions = new Set([
  ".aac",
  ".avi",
  ".gz",
  ".m4a",
  ".mov",
  ".mp3",
  ".mp4",
  ".tar",
  ".wav",
  ".webm",
  ".zip",
]);

const command = process.argv[2] ?? "help";
const options = parseArgs(process.argv.slice(3));

try {
  if (command === "snapshot") {
    snapshotCommand(options);
  } else if (command === "diff") {
    diffCommand(options);
  } else if (command === "check") {
    checkCommand(options);
  } else if (command === "rebuild-plan") {
    rebuildPlanCommand(options);
  } else {
    printHelp();
  }
} catch (error) {
  console.error(`site-ledger failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

function snapshotCommand(opts) {
  const label = slug(opts.label ?? config.snapshotPolicy.defaultLabel ?? "manual");
  const previous = latestSnapshotBeforeWrite();
  const snapshot = collectSnapshot({ label, note: opts.note ?? "" });
  const findings = evaluateSnapshot(snapshot);
  snapshot.health = findings;

  const artifacts = ensureArtifactDirs();
  const fileName = `${snapshot.generatedAt.replace(/[:.]/g, "-")}__${label}.json`;
  const snapshotPath = path.join(artifacts.snapshotDir, fileName);
  writeJson(snapshotPath, snapshot);
  copyFileSync(snapshotPath, artifacts.latestSnapshot);

  let reportPath = "";
  if (!opts["no-report"]) {
    reportPath = path.join(
      artifacts.reportDir,
      `${snapshot.generatedAt.replace(/[:.]/g, "-")}__${label}.md`
    );
    writeFileSync(reportPath, renderSnapshotReport(snapshot, previous), "utf8");
  }

  appendChangelog(snapshot, previous);

  console.log(`site-ledger snapshot written: ${relativeToRepo(snapshotPath)}`);
  console.log(`latest pointer updated: ${relativeToRepo(artifacts.latestSnapshot)}`);
  if (reportPath) console.log(`human report written: ${relativeToRepo(reportPath)}`);
  printFindingSummary(findings);
}

function diffCommand(opts) {
  const { from, to } = resolveDiffTargets(opts);
  if (!from || !to) {
    throw new Error("Need two snapshots. Run `npm run ledger:snapshot` first.");
  }
  const before = readJson(from);
  const after = readJson(to);
  const diff = diffSnapshots(before, after);
  const output = renderDiffReport(diff);

  if (opts.write) {
    const artifacts = ensureArtifactDirs();
    const reportPath = path.join(
      artifacts.reportDir,
      `${after.generatedAt.replace(/[:.]/g, "-")}__diff.md`
    );
    writeFileSync(reportPath, output, "utf8");
    console.log(`diff report written: ${relativeToRepo(reportPath)}`);
  } else {
    console.log(output);
  }
}

function checkCommand(opts) {
  const snapshot = opts.snapshot
    ? readJson(path.resolve(webRoot, opts.snapshot))
    : collectSnapshot({ label: "check", note: "runtime check, not persisted" });
  const findings = evaluateSnapshot(snapshot);
  printFindingSummary(findings);
  if (findings.some((finding) => finding.level === "error")) {
    process.exit(1);
  }
}

function rebuildPlanCommand(opts) {
  const snapshot = opts.snapshot
    ? readJson(path.resolve(webRoot, opts.snapshot))
    : existsSync(path.join(webRoot, config.generatedArtifacts.latestSnapshot))
      ? readJson(path.join(webRoot, config.generatedArtifacts.latestSnapshot))
      : collectSnapshot({ label: "rebuild-plan", note: "generated without persisted snapshot" });

  ensureArtifactDirs();
  const planPath = path.join(webRoot, config.generatedArtifacts.rebuildPlan);
  writeFileSync(planPath, renderRebuildPlan(snapshot), "utf8");
  console.log(`rebuild plan written: ${relativeToRepo(planPath)}`);
}

function collectSnapshot({ label, note }) {
  const generatedAt = new Date().toISOString();
  const git = collectGitInfo();
  const gitStatusMap = gitStatusByPath(git.statusLines);
  const files = collectFileManifest(gitStatusMap);
  const routes = collectRoutes(files);
  const data = collectDataSummary();
  const pkg = collectPackageSummary();
  const architecture = collectArchitecture(files, routes);

  return {
    schemaVersion: "1.0.0",
    siteId: config.siteId,
    siteName: config.siteName,
    label,
    note,
    generatedAt,
    generatedAtTokyo: formatTokyo(generatedAt),
    repoRoot: relativeToHome(repoRoot),
    webRoot: relativeToHome(webRoot),
    projectRoot: relativeToHome(projectRoot),
    git,
    restoreSafety: {
      restoreSafe: !git.isDirty,
      reason: git.isDirty
        ? "Working tree has uncommitted changes; commit or stash them before treating this snapshot as a restore point."
        : "Git HEAD is clean and can be used as a restore anchor.",
    },
    package: pkg,
    data,
    architecture,
    routes,
    files,
    health: [],
  };
}

function collectGitInfo() {
  const branch = git(["branch", "--show-current"]) || "(detached)";
  const head = git(["rev-parse", "HEAD"]) || "unknown";
  const headShort = git(["rev-parse", "--short", "HEAD"]) || "unknown";
  const statusOutput = git(["status", "--short", "--untracked-files=all"]) || "";
  const statusLines = statusOutput.split("\n").filter(Boolean);
  return {
    branch,
    head,
    headShort,
    isDirty: statusLines.length > 0,
    statusLines,
  };
}

function gitStatusByPath(statusLines) {
  const map = new Map();
  for (const line of statusLines) {
    const code = line.slice(0, 2).trim() || "modified";
    const raw = line.slice(3);
    const target = raw.includes(" -> ") ? raw.split(" -> ").at(-1) : raw;
    map.set(target, code);
  }
  return map;
}

function collectFileManifest(gitStatusMap) {
  const files = new Map();
  const missingTrackedRoots = [];

  for (const root of config.trackedRoots) {
    const rootPath = path.resolve(webRoot, root);
    if (!existsSync(rootPath)) {
      missingTrackedRoots.push(root);
      continue;
    }
    for (const filePath of walkFiles(rootPath)) {
      if (shouldSkipFile(filePath)) continue;
      files.set(relativeToRepo(filePath), manifestEntry(filePath, gitStatusMap));
    }
  }

  for (const file of config.trackedRootFiles) {
    const filePath = path.join(webRoot, file);
    if (existsSync(filePath) && !shouldSkipFile(filePath)) {
      files.set(relativeToRepo(filePath), manifestEntry(filePath, gitStatusMap));
    }
  }

  const manifest = Array.from(files.values()).sort((a, b) => a.path.localeCompare(b.path));
  if (missingTrackedRoots.length > 0) {
    manifest.push({
      path: "__missing_tracked_roots__",
      category: "ledger-warning",
      missingTrackedRoots,
    });
  }
  return manifest;
}

function walkFiles(dir) {
  const output = [];
  const entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  for (const entry of entries) {
    const nextPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (shouldSkipDir(nextPath, entry.name)) continue;
      output.push(...walkFiles(nextPath));
    } else if (entry.isFile()) {
      output.push(nextPath);
    }
  }
  return output;
}

function shouldSkipDir(dirPath, name) {
  if (ignoredDirNames.has(name)) return true;
  if (name.startsWith(".baseline-")) return true;

  const webRelative = toPosix(path.relative(webRoot, dirPath));
  const projectRelative = toPosix(path.relative(projectRoot, dirPath));
  return (
    webRelative === "data/audio-cache" ||
    webRelative.startsWith("ops/site-ledger/snapshots") ||
    webRelative.startsWith("ops/site-ledger/reports") ||
    projectRelative.startsWith("web/ops/site-ledger/snapshots") ||
    projectRelative.startsWith("web/ops/site-ledger/reports")
  );
}

function shouldSkipFile(filePath) {
  const base = path.basename(filePath);
  const ext = path.extname(filePath).toLowerCase();
  if (base === ".env" || base.startsWith(".env.")) return true;
  if (base.endsWith(".token") || base.endsWith(".secret")) return true;
  if (ignoredBinaryExtensions.has(ext)) return true;
  return false;
}

function manifestEntry(filePath, gitStatusMap) {
  const stats = statSync(filePath);
  const rel = relativeToRepo(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const content = readFileSync(filePath);
  const entry = {
    path: rel,
    webPath: filePath.startsWith(webRoot) ? toPosix(path.relative(webRoot, filePath)) : null,
    category: categorizePath(filePath),
    bytes: stats.size,
    mtime: stats.mtime.toISOString(),
    sha256: sha256(content),
    gitStatus: gitStatusMap.get(rel) ?? "clean",
  };

  if (textExtensions.has(ext)) {
    const text = content.toString("utf8");
    entry.lines = text.length === 0 ? 0 : text.split(/\r?\n/).length;
  }

  return entry;
}

function categorizePath(filePath) {
  const relWeb = toPosix(path.relative(webRoot, filePath));
  const relProject = toPosix(path.relative(projectRoot, filePath));
  const base = path.basename(filePath);

  if (relWeb.startsWith("app/api/") && base === "route.ts") return "api-route";
  if (relWeb.startsWith("app/") && base === "page.tsx") return "page";
  if (relWeb.startsWith("app/") && base === "layout.tsx") return "layout";
  if (relWeb.startsWith("app/")) return "app-support";
  if (relWeb.startsWith("components/")) return "component";
  if (relWeb.startsWith("data/")) return "runtime-data";
  if (relWeb.startsWith("docs/")) return "docs";
  if (relWeb.startsWith("lib/db/migrations/")) return "db-migration";
  if (relWeb.startsWith("lib/")) return "library-code";
  if (relWeb.startsWith("public/")) return "public-asset";
  if (relWeb.startsWith("scripts/")) return "script";
  if (relWeb.startsWith("types/")) return "type";
  if (relWeb.startsWith("ops/site-ledger/")) return "site-ledger";
  if (relProject.startsWith("SAP日语培训/output/")) return "course-source";
  if (relProject.startsWith("sap_jp_training_course/output/")) return "course-output";
  if (relProject.startsWith("sap_jp_training_course/prompts_v4/")) return "course-prompt";
  return "config";
}

function collectRoutes(files) {
  const routeFiles = files.filter((file) =>
    ["page", "api-route", "layout"].includes(file.category)
  );
  const middlewareText = safeRead(path.join(webRoot, "middleware.ts"));
  const middlewareMatchers = extractMiddlewareMatchers(middlewareText);

  return routeFiles
    .map((file) => {
      const route = routeFromFile(file.webPath);
      const sourceText = safeRead(path.join(webRoot, file.webPath));
      const expectedAccess = expectedAccessForRoute(route, file.category);
      const middlewareCovered = isRouteCoveredByMiddleware(route, middlewareMatchers);
      const serverGuardMarkers = detectServerGuardMarkers(sourceText);
      const effectiveAccess = inferEffectiveAccess({
        route,
        expectedAccess,
        middlewareCovered,
        serverGuardMarkers,
      });

      return {
        route,
        file: file.path,
        type: file.category === "api-route" ? "api" : file.category,
        expectedAccess,
        effectiveAccess,
        middlewareCovered,
        serverGuardMarkers,
        sha256: file.sha256,
      };
    })
    .sort((a, b) => a.route.localeCompare(b.route) || a.type.localeCompare(b.type));
}

function routeFromFile(webPath) {
  const appRelative = toPosix(path.relative("app", webPath));
  const fileName = path.basename(appRelative);
  const dirName = toPosix(path.dirname(appRelative));
  const routeDir = dirName === "." ? "" : dirName;

  if (fileName === "route.ts" && routeDir.startsWith("api")) {
    return `/${routeDir}`;
  }
  if (fileName === "page.tsx" || fileName === "layout.tsx") {
    return routeDir ? `/${routeDir}` : "/";
  }
  return `/${routeDir}`;
}

function extractMiddlewareMatchers(text) {
  const matcherBlock = text.match(/matcher:\s*\[([\s\S]*?)\]/m)?.[1] ?? "";
  return Array.from(matcherBlock.matchAll(/"([^"]+)"/g)).map((match) => match[1]);
}

function expectedAccessForRoute(route, category) {
  if (category === "layout") return "not_applicable";
  if (route.startsWith("/api/cron/")) return "cron_secret";
  if (route.startsWith("/api/auth/")) return "public_auth";
  if (config.publicRoutes.includes(route)) return "public";
  if (config.protectedPrefixes.some((prefix) => route === prefix || route.startsWith(`${prefix}/`))) {
    return "session_required";
  }
  return route.startsWith("/api/") ? "session_required" : "public_or_review";
}

function isRouteCoveredByMiddleware(route, matchers) {
  if (route === "/") return false;
  return matchers.some((matcher) => {
    if (matcher.includes("((?!auth/).*)")) return route.startsWith("/api/") && !route.startsWith("/api/auth/");
    const prefix = matcher.replace("/:path*", "");
    return route === prefix || route.startsWith(`${prefix}/`);
  });
}

function detectServerGuardMarkers(text) {
  const markers = [];
  if (text.includes("auth(") || text.includes("auth()")) markers.push("auth");
  if (text.includes("redirect(") && text.includes("/login")) markers.push("login_redirect");
  if (text.includes("getServerSession")) markers.push("server_session");
  if (text.includes("requireAdmin") || text.includes("requireTeacher")) markers.push("role_guard");
  return markers;
}

function inferEffectiveAccess({ route, expectedAccess, middlewareCovered, serverGuardMarkers }) {
  if (expectedAccess === "public" || expectedAccess === "public_auth" || expectedAccess === "not_applicable") {
    return expectedAccess;
  }
  if (expectedAccess === "cron_secret") return middlewareCovered ? "cron_secret" : "cron_uncovered";
  if (middlewareCovered) return "middleware_session";
  if (serverGuardMarkers.length > 0) return "server_guarded";
  return route.startsWith("/api/") ? "api_uncovered" : "uncovered_expected_protected";
}

function collectDataSummary() {
  const dataDir = path.join(webRoot, "data");
  const summary = {};
  if (!existsSync(dataDir)) return summary;

  for (const fileName of readdirSync(dataDir).filter((name) => name.endsWith(".json")).sort()) {
    const filePath = path.join(dataDir, fileName);
    const json = readJson(filePath);
    summary[`data/${fileName}`] = summarizeJsonData(fileName, json);
  }
  return summary;
}

function summarizeJsonData(fileName, json) {
  if (Array.isArray(json)) {
    return {
      type: "array",
      count: json.length,
      sampleIds: json
        .slice(0, 5)
        .map((item) => item?.id ?? item?.lessonId ?? item?.slug)
        .filter(Boolean),
    };
  }

  if (fileName === "_meta.json") {
    return {
      type: "object",
      schemaVersion: json.schemaVersion ?? null,
      generatedAt: json.generatedAt ?? null,
      sourceCommit: json.sourceCommit ?? null,
      stats: json.stats ?? {},
      audio: json.audio ?? {},
      backend: json.backend ?? {},
      compliance: json.compliance ?? {},
      noteCount: Array.isArray(json.notes) ? json.notes.length : 0,
    };
  }

  if (fileName === "japanese-coach.json") {
    return {
      type: "object",
      updatedAt: json.updatedAt ?? null,
      teachingPrinciples: Array.isArray(json.teachingPrinciples) ? json.teachingPrinciples.length : 0,
      forbiddenHabits: Array.isArray(json.forbiddenHabits) ? json.forbiddenHabits.length : 0,
      lessonEntries: Array.isArray(json.lessonEntries) ? json.lessonEntries.length : 0,
    };
  }

  return {
    type: "object",
    keys: Object.keys(json).sort(),
  };
}

function collectPackageSummary() {
  const pkgPath = path.join(webRoot, "package.json");
  const lockPath = path.join(webRoot, "package-lock.json");
  const pkg = readJson(pkgPath);
  return {
    name: pkg.name,
    version: pkg.version,
    scripts: pkg.scripts ?? {},
    dependencies: Object.keys(pkg.dependencies ?? {}).sort(),
    devDependencies: Object.keys(pkg.devDependencies ?? {}).sort(),
    packageJsonSha256: sha256(readFileSync(pkgPath)),
    packageLockSha256: existsSync(lockPath) ? sha256(readFileSync(lockPath)) : null,
  };
}

function collectArchitecture(files, routes) {
  const byCategory = {};
  for (const file of files) {
    byCategory[file.category] = (byCategory[file.category] ?? 0) + 1;
  }

  return {
    fileCounts: byCategory,
    routeCounts: routes.reduce((acc, route) => {
      acc[route.type] = (acc[route.type] ?? 0) + 1;
      return acc;
    }, {}),
    trackedRoots: config.trackedRoots,
    trackedRootFiles: config.trackedRootFiles,
  };
}

function evaluateSnapshot(snapshot) {
  const findings = [];
  const fileSet = new Set(snapshot.files.map((file) => file.webPath).filter(Boolean));

  for (const required of config.requiredFiles) {
    if (!fileSet.has(required)) {
      findings.push({
        level: "error",
        code: "missing_required_file",
        message: `Required file is missing from snapshot: ${required}`,
      });
    }
  }

  for (const [file, expected] of Object.entries(config.expectedContentCounts ?? {})) {
    const actual = snapshot.data[file]?.count;
    if (actual !== expected) {
      findings.push({
        level: "warning",
        code: "content_count_changed",
        message: `${file} count is ${actual ?? "missing"}, expected ${expected}.`,
      });
    }
  }

  const meta = snapshot.data["data/_meta.json"];
  if (!meta?.schemaVersion) {
    findings.push({
      level: "warning",
      code: "missing_meta_schema",
      message: "data/_meta.json has no schemaVersion.",
    });
  }

  for (const route of snapshot.routes) {
    if (route.effectiveAccess === "uncovered_expected_protected") {
      findings.push({
        level: "warning",
        code: "protected_route_not_in_middleware",
        message: `${route.route} is expected to be protected but is not covered by middleware and has no server guard marker.`,
      });
    }
    if (route.effectiveAccess === "api_uncovered") {
      findings.push({
        level: "error",
        code: "api_route_not_in_middleware",
        message: `${route.route} is expected to require a session but is not covered by middleware.`,
      });
    }
    if (route.effectiveAccess === "cron_uncovered") {
      findings.push({
        level: "error",
        code: "cron_route_not_in_middleware",
        message: `${route.route} is expected to require CRON_SECRET but is not covered by middleware.`,
      });
    }
  }

  if (snapshot.git.isDirty) {
    findings.push({
      level: "warning",
      code: "working_tree_dirty",
      message: `Working tree has ${snapshot.git.statusLines.length} uncommitted path(s); snapshot is observational, not a clean restore anchor.`,
    });
  }

  if (findings.length === 0) {
    findings.push({
      level: "info",
      code: "ledger_check_passed",
      message: "No ledger health errors or warnings detected.",
    });
  }

  return findings;
}

function resolveDiffTargets(opts) {
  const snapshots = listSnapshotFiles();
  const from = opts.from ? path.resolve(webRoot, opts.from) : snapshots.at(-2);
  const to = opts.to ? path.resolve(webRoot, opts.to) : snapshots.at(-1);
  return { from, to };
}

function latestSnapshotBeforeWrite() {
  const snapshots = listSnapshotFiles();
  return snapshots.length > 0 ? readJson(snapshots.at(-1)) : null;
}

function listSnapshotFiles() {
  const snapshotDir = path.join(webRoot, config.generatedArtifacts.snapshotDir);
  if (!existsSync(snapshotDir)) return [];
  return readdirSync(snapshotDir)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => path.join(snapshotDir, name));
}

function diffSnapshots(before, after) {
  const beforeFiles = new Map(before.files.map((file) => [file.path, file]));
  const afterFiles = new Map(after.files.map((file) => [file.path, file]));
  const added = [];
  const removed = [];
  const changed = [];

  for (const [filePath, file] of afterFiles) {
    const oldFile = beforeFiles.get(filePath);
    if (!oldFile) {
      added.push(file);
    } else if (oldFile.sha256 !== file.sha256) {
      changed.push({ path: filePath, before: oldFile.sha256, after: file.sha256, category: file.category });
    }
  }

  for (const [filePath, file] of beforeFiles) {
    if (!afterFiles.has(filePath)) removed.push(file);
  }

  const beforeRoutes = new Map(before.routes.map((route) => [route.route, route]));
  const afterRoutes = new Map(after.routes.map((route) => [route.route, route]));
  const routes = {
    added: Array.from(afterRoutes.values()).filter((route) => !beforeRoutes.has(route.route)),
    removed: Array.from(beforeRoutes.values()).filter((route) => !afterRoutes.has(route.route)),
    changed: Array.from(afterRoutes.values()).filter((route) => {
      const oldRoute = beforeRoutes.get(route.route);
      return oldRoute && (oldRoute.sha256 !== route.sha256 || oldRoute.effectiveAccess !== route.effectiveAccess);
    }),
  };

  return {
    from: { generatedAt: before.generatedAt, git: before.git },
    to: { generatedAt: after.generatedAt, git: after.git },
    files: { added, removed, changed },
    routes,
    dataCounts: diffDataCounts(before.data, after.data),
  };
}

function diffDataCounts(beforeData, afterData) {
  const keys = Array.from(new Set([...Object.keys(beforeData), ...Object.keys(afterData)])).sort();
  return keys
    .map((key) => ({
      file: key,
      before: beforeData[key]?.count ?? beforeData[key]?.stats ?? beforeData[key]?.lessonEntries ?? null,
      after: afterData[key]?.count ?? afterData[key]?.stats ?? afterData[key]?.lessonEntries ?? null,
    }))
    .filter((entry) => JSON.stringify(entry.before) !== JSON.stringify(entry.after));
}

function renderSnapshotReport(snapshot, previous) {
  const diff = previous ? diffSnapshots(previous, snapshot) : null;
  const dirtyLines = snapshot.git.statusLines.slice(0, 40);
  const dataLines = Object.entries(snapshot.data)
    .map(([file, value]) => `- ${file}: ${dataSummaryLabel(value)}`)
    .join("\n");
  const findingLines = snapshot.health
    .map((finding) => `- ${finding.level.toUpperCase()} ${finding.code}: ${finding.message}`)
    .join("\n");

  return `# sap-jp.training Site Ledger Snapshot

- schemaVersion: ${snapshot.schemaVersion}
- siteId: ${snapshot.siteId}
- generated_at: ${snapshot.generatedAtTokyo}
- label: ${snapshot.label}
- branch: ${snapshot.git.branch}
- commit: ${snapshot.git.headShort}
- restore_safe: ${snapshot.restoreSafety.restoreSafe}
- note: ${snapshot.note || "(none)"}

## What This Captures

- Content data hashes and counts under \`data/\`.
- Page, API, component, script, library, docs, and Project 4 course-source file hashes.
- Route inventory with expected access and middleware coverage.
- Package scripts and dependency names.
- Git dirty state so restore risk is explicit.

## Data Summary

${dataLines || "- No data files found."}

## Architecture Counts

\`\`\`json
${JSON.stringify(snapshot.architecture, null, 2)}
\`\`\`

## Health

${findingLines}

## Dirty Working Tree

${dirtyLines.length ? dirtyLines.map((line) => `- ${line}`).join("\n") : "- Clean."}

## Delta From Previous Snapshot

${diff ? renderDiffBody(diff) : "- No previous snapshot found."}

## AI Quick Context

- Latest machine-readable snapshot: \`projects/4-sap-training/web/ops/site-ledger/latest.json\`
- Historical snapshots: \`projects/4-sap-training/web/ops/site-ledger/snapshots/\`
- Human reports: \`projects/4-sap-training/web/ops/site-ledger/reports/\`
- Restore guide: run \`npm run ledger:rebuild-plan\`
`;
}

function renderDiffReport(diff) {
  return `# sap-jp.training Site Ledger Diff

- from: ${diff.from.generatedAt} (${diff.from.git.headShort})
- to: ${diff.to.generatedAt} (${diff.to.git.headShort})

${renderDiffBody(diff)}
`;
}

function renderDiffBody(diff) {
  const changedLines = diff.files.changed.slice(0, 80).map((file) => `- ${file.path} (${file.category})`);
  const addedLines = diff.files.added.slice(0, 80).map((file) => `- ${file.path} (${file.category})`);
  const removedLines = diff.files.removed.slice(0, 80).map((file) => `- ${file.path} (${file.category})`);
  const routeLines = [
    ...diff.routes.added.map((route) => `- ADDED ${route.route} -> ${route.file}`),
    ...diff.routes.removed.map((route) => `- REMOVED ${route.route} -> ${route.file}`),
    ...diff.routes.changed.map((route) => `- CHANGED ${route.route} -> ${route.effectiveAccess}`),
  ];
  const dataLines = diff.dataCounts.map(
    (entry) => `- ${entry.file}: ${inlineJson(entry.before)} -> ${inlineJson(entry.after)}`
  );

  return `## Files

- added: ${diff.files.added.length}
- removed: ${diff.files.removed.length}
- changed: ${diff.files.changed.length}

### Added

${addedLines.length ? addedLines.join("\n") : "- None."}

### Removed

${removedLines.length ? removedLines.join("\n") : "- None."}

### Changed

${changedLines.length ? changedLines.join("\n") : "- None."}

## Routes

${routeLines.length ? routeLines.join("\n") : "- No route changes."}

## Data Counts

${dataLines.length ? dataLines.join("\n") : "- No data count changes."}
`;
}

function renderRebuildPlan(snapshot) {
  const requiredFiles = config.requiredFiles.map((file) => `- \`${file}\``).join("\n");
  const findings = evaluateSnapshot(snapshot)
    .map((finding) => `- ${finding.level.toUpperCase()} ${finding.code}: ${finding.message}`)
    .join("\n");

  return `# sap-jp.training Local Rebuild Plan

- updated_by: site-ledger
- updated_at: ${formatTokyo(new Date().toISOString())}
- source_snapshot: ${snapshot.generatedAt}
- source_branch: ${snapshot.git.branch}
- source_commit: ${snapshot.git.head}
- restore_safe: ${snapshot.restoreSafety.restoreSafe}

## Recovery Principle

Use Git as the content and code source of truth. Use this ledger to identify the exact branch, commit, route map, data counts, and files that must exist after rebuild. Do not restore secrets from the ledger; recreate them in local \`.env.local\` or the deployment provider.

## Local Rebuild Steps

1. Restore or clone \`/Users/openclawxiaoer/sap-hub\`.
2. Check out the recorded branch and commit:

\`\`\`bash
git checkout ${snapshot.git.branch}
git checkout ${snapshot.git.head}
\`\`\`

3. Install the web dependencies:

\`\`\`bash
cd projects/4-sap-training/web
npm install
\`\`\`

4. Recreate local-only secrets in \`.env.local\`. Do not commit this file.
5. Rebuild generated content if source Markdown changed:

\`\`\`bash
npm run convert:content
\`\`\`

6. Run the verification gate:

\`\`\`bash
npm run ledger:check
npm run typecheck
npm run lint
npm run build
\`\`\`

7. Start local review:

\`\`\`bash
npm run dev
\`\`\`

## Required Files

${requiredFiles}

## Snapshot Health

${findings}

## Data Counts At Snapshot Time

\`\`\`json
${JSON.stringify(snapshot.data, null, 2)}
\`\`\`
`;
}

function appendChangelog(snapshot, previous) {
  const artifacts = ensureArtifactDirs();
  const diff = previous ? diffSnapshots(previous, snapshot) : null;
  const line = `\n## ${snapshot.generatedAtTokyo} · ${snapshot.label}\n\n- commit: ${snapshot.git.headShort}\n- branch: ${snapshot.git.branch}\n- restore_safe: ${snapshot.restoreSafety.restoreSafe}\n- files: ${snapshot.files.length}\n- routes: ${snapshot.routes.length}\n- health: ${snapshot.health.map((finding) => `${finding.level}:${finding.code}`).join(", ")}\n${
    diff
      ? `- delta: +${diff.files.added.length} / -${diff.files.removed.length} / changed ${diff.files.changed.length}\n`
      : "- delta: first snapshot\n"
  }`;

  const changelogPath = artifacts.changelog;
  const existing = existsSync(changelogPath)
    ? readFileSync(changelogPath, "utf8")
    : "# sap-jp.training Site Ledger Changelog\n";
  writeFileSync(changelogPath, `${existing.trimEnd()}\n${line}`, "utf8");
}

function ensureArtifactDirs() {
  const snapshotDir = path.join(webRoot, config.generatedArtifacts.snapshotDir);
  const reportDir = path.join(webRoot, config.generatedArtifacts.reportDir);
  mkdirSync(snapshotDir, { recursive: true });
  mkdirSync(reportDir, { recursive: true });
  return {
    snapshotDir,
    reportDir,
    latestSnapshot: path.join(webRoot, config.generatedArtifacts.latestSnapshot),
    changelog: path.join(webRoot, config.generatedArtifacts.changelog),
  };
}

function printFindingSummary(findings) {
  const errors = findings.filter((finding) => finding.level === "error").length;
  const warnings = findings.filter((finding) => finding.level === "warning").length;
  console.log(`ledger health: ${errors} error(s), ${warnings} warning(s)`);
  for (const finding of findings) {
    console.log(`${finding.level.toUpperCase()} ${finding.code}: ${finding.message}`);
  }
}

function dataSummaryLabel(value) {
  if (value.type === "array") return `array count=${value.count}`;
  if (value.schemaVersion) return `schemaVersion=${value.schemaVersion}, stats=${inlineJson(value.stats)}`;
  if (typeof value.lessonEntries === "number") return `lessonEntries=${value.lessonEntries}`;
  return `object keys=${(value.keys ?? []).join(",")}`;
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}

function printHelp() {
  console.log(`site-ledger

Commands:
  snapshot [--label name] [--note text] [--no-report]
  diff [--from ops/site-ledger/snapshots/a.json] [--to ops/site-ledger/snapshots/b.json] [--write]
  check [--snapshot ops/site-ledger/latest.json]
  rebuild-plan [--snapshot ops/site-ledger/latest.json]

Examples:
  npm run ledger:snapshot -- --label before-content-change
  npm run ledger:diff
  npm run ledger:check
  npm run ledger:rebuild-plan
`);
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function git(args) {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) return "";
  return result.stdout.trim();
}

function safeRead(filePath) {
  return existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
}

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

function slug(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function relativeToRepo(filePath) {
  return toPosix(path.relative(repoRoot, filePath));
}

function relativeToHome(filePath) {
  const home = process.env.HOME;
  return home && filePath.startsWith(home) ? `~${filePath.slice(home.length)}` : filePath;
}

function formatTokyo(isoString) {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  return `${formatter.format(new Date(isoString)).replace(" ", "T")}+09:00`;
}

function inlineJson(value) {
  return JSON.stringify(value);
}
