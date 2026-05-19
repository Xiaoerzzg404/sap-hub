import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
// 新位置：cwd 是 projects/4-sap-training/web，源在 ../SAP日语培训/output
const sourceRoot = path.resolve(root, "../SAP日语培训/output");
const dataDir = path.join(root, "data");
const logsDir = path.resolve(root, "../../../logs");

const categories = {
  "会议开场与课堂互动": "meeting",
  "会议开场": "meeting",
  "画面共享": "screen-sharing",
  "需求确认": "requirement-confirmation",
  "复述理解": "requirement-confirmation",
  "追问细节": "requirement-confirmation",
  "系统操作说明": "process-explanation",
  "配置 / 主数据 / 流程说明": "configuration",
  "配置说明": "configuration",
  "测试 / UAT / 问题处理": "testing",
  "测试说明": "testing",
  "问题处理": "issue-handling",
  "权限问题": "issue-handling",
  "范围确认与下一步推进": "scope-management",
  "范围确认": "scope-management",
  "会议纪要": "next-step",
  "催促与推进": "next-step",
  "面试项目经验说明": "interview"
};

const moduleCandidates = ["FI", "CO", "MM", "SD", "PP", "Basis", "ABAP", "Project", "Common", "PMO"];
const phaseCandidates = ["project preparation", "blueprint", "realization", "testing", "go-live", "hypercare"];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
}

function writeJson(file, value) {
  fs.writeFileSync(path.join(dataDir, file), `${JSON.stringify(value, null, 2)}\n`);
}

function parseTable(markdown) {
  return markdown
    .split(/\r?\n/)
    .filter((line) => /^\s*\|.*\|\s*$/.test(line))
    .map((line) =>
      line
        .trim()
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((cell) => cell.trim())
    )
    .filter((row) => !row.every((cell) => /^:?-{3,}:?$/.test(cell)));
}

function section(markdown, headingPattern) {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => headingPattern.test(line));
  if (start < 0) return "";
  const level = (lines[start].match(/^#+/)?.[0].length ?? 2);
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    const match = lines[i].match(/^(#{1,6})\s+/);
    if (match && match[1].length <= level) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join("\n");
}

function splitParts(value) {
  return value
    .split(/\s*[/、,，]\s*/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeLessonId(raw) {
  const match = raw.match(/lesson[_-]?(\d{1,2})|第\s*(\d{1,2})\s*课/i);
  const num = Number(match?.[1] ?? match?.[2] ?? 0);
  return num ? `lesson_${String(num).padStart(2, "0")}` : raw;
}

function lessonOrder(lessonId) {
  return Number(lessonId.match(/\d+/)?.[0] ?? 0);
}

function placeholderAudio(lessonId, type, index) {
  return `/audio/placeholders/${lessonId}_${type}_${String(index).padStart(3, "0")}.mp3`;
}

function parseTitle(markdown, fallbackId) {
  const h1 = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
  const quoted = h1?.match(/《(.+?)》/)?.[1];
  return quoted || h1?.replace(/^SAP\s*日语培训[:：]\s*/, "") || fallbackId;
}

function parseLineValue(markdown, label) {
  const match = markdown.match(new RegExp(`-\\s*${label}[:：]\\s*(.+)`));
  return match?.[1]?.trim() ?? "";
}

function parseScenarioMap(markdown, lessonId) {
  const rows = parseTable(section(markdown, /SAP\s*场景地图/));
  return rows
    .slice(1)
    .map((row, index) => ({
      id: `${lessonId}-scenario-${index + 1}`,
      scene: row[0] ?? "",
      sourceCue: row[1] ?? "",
      consultantAction: row[2] ?? "",
      japaneseTarget: row[3] ?? "",
      studentOutput: row[4] ?? ""
    }))
    .filter((item) => item.scene);
}

function parseTermsFromDesign(markdown, lessonId, reviewSet) {
  const rows = parseTable(section(markdown, /本课\s*SAP\s*日语术语表/));
  return rows
    .slice(1)
    .map((row, index) => {
      const japanese = row[2] ?? "";
      const english = row[1] ?? "";
      const note = row[5] ?? "";
      return {
        id: `${lessonId}-term-${String(index + 1).padStart(3, "0")}`,
        lessonId,
        chinese: row[0] ?? "",
        englishOrSap: english,
        japanese,
        reading: row[3] ?? "",
        module: inferModule(`${row.join(" ")} ${markdown}`),
        projectPhase: inferPhase(`${row.join(" ")} ${markdown}`),
        scenario: row[4] ?? "项目现场",
        exampleSentence: `${japanese}について、対象範囲と影響範囲を確認いたします。`,
        note,
        needsReview: reviewSet.has(english.toLowerCase()) || /ASR|复核|误|疑似|需/.test(note)
      };
    })
    .filter((item) => item.japanese || item.englishOrSap || item.chinese);
}

function inferModule(text) {
  const upper = text.toUpperCase();
  const found = moduleCandidates.find((item) => upper.includes(item.toUpperCase()));
  return found === "Common" ? "Project" : found || "Project";
}

function inferPhase(text) {
  const lower = text.toLowerCase();
  return phaseCandidates.find((item) => lower.includes(item)) || "project preparation";
}

function parsePhrasesFromGlobal(markdown) {
  const rows = parseTable(markdown);
  return rows.slice(1).map((row, index) => {
    const lessonId = normalizeLessonId(row[0] ?? "");
    const categoryLabel = row[1] ?? "";
    return {
      id: `${lessonId}-phrase-${String(index + 1).padStart(3, "0")}`,
      lessonId,
      category: categories[categoryLabel] ?? "meeting",
      japanese: row[2] ?? "",
      chinese: row[3] ?? "",
      usage: row[4] ?? categoryLabel,
      replaceableParts: splitParts(row[5] ?? ""),
      exampleVariations: splitParts(row[5] ?? "").map((part) => `${row[2] ?? ""} / ${part}`),
      audioSrc: placeholderAudio(lessonId, "phrase", index + 1)
    };
  }).filter((item) => item.lessonId && item.japanese);
}

function parseReviewTerms(markdown) {
  const rows = parseTable(markdown);
  return rows.slice(1).map((row, index) => ({
    id: `${normalizeLessonId(row[0] ?? "lesson_00")}-review-${String(index + 1).padStart(3, "0")}`,
    lessonId: normalizeLessonId(row[0] ?? ""),
    rawText: row[1] ?? "",
    suggestion: row[2] ?? "",
    adoptedJapanese: row[2] ?? "",
    reason: row[3] ?? "",
    mustReview: /是|yes|true/i.test(row[5] ?? ""),
    status: "pending",
    memo: row[4] ?? ""
  })).filter((item) => item.lessonId);
}

function parseRoleplays(markdown) {
  const lessonBlocks = markdown.split(/\n(?=##\s+第\s*\d+\s*课)/g).filter((block) => /^##\s+第\s*\d+\s*课/m.test(block));
  const roleplays = [];
  for (const block of lessonBlocks) {
    const lessonMatch = block.match(/^##\s+第\s*(\d{1,2})\s*课[:：]\s*(.+)$/m);
    if (!lessonMatch) continue;
    const lessonId = `lesson_${String(Number(lessonMatch[1])).padStart(2, "0")}`;
    const playBlocks = block.split(/\n(?=###\s+Role Play)/g).filter((part) => /^###\s+Role Play/m.test(part));
    for (const [index, part] of playBlocks.entries()) {
      const title = part.match(/^###\s+(.+)$/m)?.[1]?.trim() ?? `Role Play ${index + 1}`;
      const scenario = part.match(/-\s*背景[:：]\s*(.+)/)?.[1]?.trim() ?? "";
      const roleA = part.match(/-\s*A[:：]\s*(.+)/)?.[1]?.trim() ?? "SAP 顾问";
      const roleB = part.match(/-\s*B[:：]\s*(.+)/)?.[1]?.trim() ?? "业务用户";
      const required = splitParts(part.match(/-\s*必须使用[:：]\s*(.+)/)?.[1] ?? "");
      const dialogue = part
        .split(/\r?\n/)
        .map((line) => line.match(/^(A|B)[:：]\s*(.+)$/))
        .filter(Boolean)
        .map((match) => ({ role: match[1], text: match[2].trim() }));
      roleplays.push({
        id: `${lessonId}-roleplay-${index + 1}`,
        lessonId,
        title,
        scenario,
        roleA,
        roleB,
        requiredPhrases: required,
        dialogue
      });
    }
  }
  return roleplays;
}

function parseAssignmentTasks(markdown, lessonId, finalOutputTask) {
  const assignments = [
    {
      id: `${lessonId}-assignment-vocabulary`,
      lessonId,
      type: "vocabulary",
      title: "词汇作业",
      prompt: "用本课 SAP 术语写项目现场句子。",
      status: "not-started"
    },
    {
      id: `${lessonId}-assignment-phrase`,
      lessonId,
      type: "phrase",
      title: "句型作业",
      prompt: "完成本课句型替换练习。",
      status: "not-started"
    },
    {
      id: `${lessonId}-assignment-recording`,
      lessonId,
      type: "recording",
      title: "Shadowing 录音",
      prompt: finalOutputTask || "请完成本课 Shadowing 录音 3 遍。",
      status: "not-started"
    }
  ];

  const consultant = section(markdown, /60\s*秒顾问输出/).replace(/^#+.+$/m, "").trim();
  if (consultant) {
    assignments.push({
      id: `${lessonId}-assignment-consultant-output`,
      lessonId,
      type: "consultant-output",
      title: "60 秒顾问输出",
      prompt: consultant.replace(/\s+/g, " ").slice(0, 500),
      status: "not-started"
    });
  }
  return assignments;
}

function parseMicroTrainings(markdown, lessonId) {
  const block = section(markdown, /30\s*秒输出训练/);
  const matches = [...block.matchAll(/-\s*任务\s*(\d+)[:：]\s*(.+)/g)];
  const fallback = matches.length ? [] : [`用日语说明 ${parseLineValue(markdown, "本课最终输出任务") || "本课核心 SAP 场景"}。`];
  const prompts = matches.map((match) => match[2].trim()).concat(fallback);
  return prompts.map((prompt, index) => ({
    id: `${lessonId}-micro-${index + 1}`,
    lessonId,
    title: `30 秒任务 ${index + 1}`,
    prompt,
    requiredKeywords: ["認識合わせ", "影響範囲", "次回までに"],
    durationSec: 30
  }));
}

function parseConsultantOutputs(markdown, lessonId) {
  const prompt = section(markdown, /60\s*秒顾问输出/).replace(/^#+.+$/m, "").replace(/^\s*请按以下框架完成[:：]?/m, "").trim();
  const fallback = parseLineValue(markdown, "本课最终输出任务") || "请用 60 秒完成项目现场顾问输出。";
  const text = prompt || fallback;
  return [
    {
      id: `${lessonId}-consultant-output-1`,
      lessonId,
      title: "60 秒顾问输出",
      prompt: text.replace(/\s+/g, " ").slice(0, 600),
      durationSec: 60,
      framework: {
        background: "业务背景和对象范围",
        input: "输入条件、数据、角色或前提",
        systemAction: "システム上では何を行うか",
        output: "生成物、结果、证迹或会议结论",
        riskIssue: "差异、影响范围、待确认事项",
        nextStep: "担当者、期限、共有方式"
      }
    }
  ];
}

function buildSubstitutionDrills(phrases, lessonId) {
  return phrases.slice(0, 12).map((phrase, index) => ({
    id: `${lessonId}-drill-${index + 1}`,
    lessonId,
    baseSentence: phrase.japanese,
    replacements: phrase.replaceableParts,
    prompt: `请替换 ${phrase.replaceableParts.join(" / ") || "关键词"} 并录音。`
  }));
}

function buildShadowingItems(phrases, transcript, lessonId) {
  const fromPhrases = phrases.map((phrase, index) => ({
    id: `${lessonId}-shadow-phrase-${index + 1}`,
    lessonId,
    japanese: phrase.japanese,
    chinese: phrase.chinese,
    scenario: phrase.usage,
    audioSrc: phrase.audioSrc,
    requiredRepeats: 3
  }));
  const transcriptLines = [];
  const lines = transcript.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    if (/【学生跟读】/.test(lines[i])) {
      const next = (lines[i + 1] ?? "").trim();
      if (next && !fromPhrases.some((item) => item.japanese === next)) {
        transcriptLines.push({
          id: `${lessonId}-shadow-script-${transcriptLines.length + 1}`,
          lessonId,
          japanese: next,
          chinese: "课堂跟读句",
          scenario: "课堂 Shadowing",
          audioSrc: placeholderAudio(lessonId, "shadowing", transcriptLines.length + 1),
          requiredRepeats: 3
        });
      }
    }
  }
  return [...fromPhrases, ...transcriptLines.slice(0, 12)];
}

function scanFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? scanFiles(full) : [full];
  });
}

ensureDir(dataDir);
ensureDir(logsDir);

const reviewMarkdown = read(path.join(sourceRoot, "09_待复核清单/SAP术语与ASR待复核总表.md"));
const reviewTerms = parseReviewTerms(reviewMarkdown);
const reviewByLesson = new Map();
for (const item of reviewTerms) {
  if (!reviewByLesson.has(item.lessonId)) reviewByLesson.set(item.lessonId, []);
  reviewByLesson.get(item.lessonId).push(item);
}
const reviewSet = new Set(reviewTerms.map((item) => item.rawText.toLowerCase()));

const phraseMarkdown = read(path.join(sourceRoot, "05_句型库/SAP日语高频句型总表.md"));
const allPhrases = parsePhrasesFromGlobal(phraseMarkdown);
const phrasesByLesson = new Map();
for (const phrase of allPhrases) {
  if (!phrasesByLesson.has(phrase.lessonId)) phrasesByLesson.set(phrase.lessonId, []);
  phrasesByLesson.get(phrase.lessonId).push(phrase);
}

const roleplayMarkdown = read(path.join(sourceRoot, "06_RolePlay脚本/SAP日语RolePlay总合集.md"));
const allRoleplays = parseRoleplays(roleplayMarkdown);
const roleplaysByLesson = new Map();
for (const rolePlay of allRoleplays) {
  if (!roleplaysByLesson.has(rolePlay.lessonId)) roleplaysByLesson.set(rolePlay.lessonId, []);
  roleplaysByLesson.get(rolePlay.lessonId).push(rolePlay);
}

const lessons = [];
const allTerms = [];
const allAssignments = [];
const conversionNotes = [];
const insufficientLessons = [];

for (let order = 1; order <= 24; order += 1) {
  const lessonId = `lesson_${String(order).padStart(2, "0")}`;
  const designFile = path.join(sourceRoot, `01_单课课程设计稿/${lessonId}_SAP日语培训课程设计稿.md`);
  const transcriptFile = path.join(sourceRoot, `02_单课日语课堂逐字稿/${lessonId}_SAP日语课堂逐字稿.md`);
  const assignmentFile = path.join(sourceRoot, `03_单课练习与作业/${lessonId}_练习与作业.md`);
  const designMarkdown = read(designFile);
  const transcriptMarkdown = read(transcriptFile);
  const assignmentMarkdown = read(assignmentFile);
  if (!designMarkdown) conversionNotes.push(`- ${lessonId}: 缺少课程设计稿 ${designFile}`);
  if (!transcriptMarkdown) conversionNotes.push(`- ${lessonId}: 缺少课堂逐字稿 ${transcriptFile}`);
  if (!assignmentMarkdown) conversionNotes.push(`- ${lessonId}: 缺少练习与作业 ${assignmentFile}`);

  const title = parseTitle(designMarkdown, lessonId);
  const lessonPhrases = phrasesByLesson.get(lessonId) ?? [];
  const terms = parseTermsFromDesign(designMarkdown, lessonId, reviewSet);
  const finalOutputTask = parseLineValue(designMarkdown, "本课最终输出任务");
  const microTrainings = parseMicroTrainings(assignmentMarkdown || designMarkdown, lessonId);
  const consultantOutputs = parseConsultantOutputs(assignmentMarkdown || designMarkdown, lessonId);
  const assignments = parseAssignmentTasks(assignmentMarkdown, lessonId, finalOutputTask);
  const lessonRoleplays = roleplaysByLesson.get(lessonId) ?? [];
  const shadowingItems = buildShadowingItems(lessonPhrases, transcriptMarkdown, lessonId);
  const reviewItems = reviewByLesson.get(lessonId) ?? [];

  if (terms.length < 5 || lessonPhrases.length < 5 || lessonRoleplays.length < 1 || shadowingItems.length < 5) {
    insufficientLessons.push(`${lessonId} ${title}: terms=${terms.length}, phrases=${lessonPhrases.length}, shadowing=${shadowingItems.length}, roleplays=${lessonRoleplays.length}`);
  }

  const lesson = {
    id: lessonId,
    title,
    order,
    sourceLessonId: lessonId,
    sapModules: splitParts(parseLineValue(designMarkdown, "对应 SAP 模块")).map((item) => (item === "Common" ? "Project" : item)),
    projectPhase: splitParts(parseLineValue(designMarkdown, "对应项目阶段")),
    japaneseSkillTargets: splitParts(parseLineValue(designMarkdown, "对应日语能力")),
    consultantSkillTargets: splitParts(parseLineValue(designMarkdown, "对应顾问能力")),
    finalOutputTask,
    summary: parseLineValue(designMarkdown, "迁移后的 SAP 日语课主题") || title,
    scenarioMap: parseScenarioMap(designMarkdown, lessonId),
    terms,
    phrases: lessonPhrases,
    shadowingItems,
    substitutionDrills: buildSubstitutionDrills(lessonPhrases, lessonId),
    rolePlays: lessonRoleplays,
    microTrainings,
    consultantOutputs,
    assignments,
    reviewItems,
    transcriptMarkdown,
    courseDesignMarkdown: designMarkdown
  };

  lessons.push(lesson);
  allTerms.push(...terms);
  allAssignments.push(...assignments);
}

const mdFiles = scanFiles(sourceRoot).filter((file) => file.endsWith(".md"));
const classified = {
  courseDesign: mdFiles.filter((file) => /课程设计稿|course-design|lesson/i.test(path.basename(file)) && /01_单课课程设计稿/.test(file)).length,
  classroomScripts: mdFiles.filter((file) => /课堂逐字稿|classroom-script|transcript/i.test(path.basename(file))).length,
  glossary: mdFiles.filter((file) => /术语|glossary/i.test(path.basename(file))).length,
  phrases: mdFiles.filter((file) => /句型|phrase/i.test(path.basename(file))).length,
  assignments: mdFiles.filter((file) => /作业|练习|assignment|practice/i.test(path.basename(file))).length
};
const unclassified = mdFiles.filter((file) => !/(课程设计稿|课堂逐字稿|术语|句型|作业|练习|RolePlay|讲师|学生|质量|总目录|待复核|README)/i.test(path.basename(file)));

writeJson("lessons.json", lessons);
writeJson("glossary.json", allTerms);
writeJson("phrases.json", allPhrases);
writeJson("roleplays.json", allRoleplays);
writeJson("assignments.json", allAssignments);
writeJson("review-terms.json", reviewTerms);

fs.writeFileSync(
  path.join(logsDir, "content-conversion-log.md"),
  [
    "# 内容转换日志",
    "",
    `- source_root: ${sourceRoot}`,
    `- scanned_markdown_files: ${mdFiles.length}`,
    `- course_design_files: ${classified.courseDesign}`,
    `- classroom_script_files: ${classified.classroomScripts}`,
    `- glossary_files: ${classified.glossary}`,
    `- phrase_files: ${classified.phrases}`,
    `- assignment_files: ${classified.assignments}`,
    "",
    "## 无法自动归类或仅作为辅助资料处理",
    "",
    ...(unclassified.length ? unclassified.map((file) => `- ${path.relative(root, file)}`) : ["- 无"]),
    "",
    "## 转换备注",
    "",
    ...(conversionNotes.length ? conversionNotes : ["- 24 课核心课程设计、逐字稿、练习作业均已识别。"]),
    ""
  ].join("\n")
);

fs.writeFileSync(
  path.join(logsDir, "data-quality-report.md"),
  [
    "# 数据检查报告",
    "",
    `- 共识别课程：${lessons.length}`,
    `- 共生成术语：${allTerms.length}`,
    `- 共生成句型：${allPhrases.length}`,
    `- 共生成 Shadowing 项：${lessons.reduce((sum, lesson) => sum + lesson.shadowingItems.length, 0)}`,
    `- 共生成录音任务：${lessons.reduce((sum, lesson) => sum + lesson.microTrainings.length + lesson.consultantOutputs.length + lesson.assignments.filter((item) => item.type === "recording" || item.type === "consultant-output").length, 0)}`,
    `- 共生成 Role Play：${allRoleplays.length}`,
    `- 共生成待复核术语：${reviewTerms.length}`,
    "",
    "## 内容不足课程",
    "",
    ...(insufficientLessons.length ? insufficientLessons.map((item) => `- ${item}`) : ["- 无，24 课均达到 MVP 训练站数据要求。"]),
    "",
    "## 说明",
    "",
    "- 标准音频暂未发现真实 mp3/wav 文件，已为每个可播放训练句生成 `/audio/placeholders/*.mp3` 占位路径。",
    "- 录音作业 MVP 使用浏览器 IndexedDB 保存，不上传服务器。",
    "- 待复核术语来自课程输出目录的待复核总表，状态统一初始化为 pending。",
    ""
  ].join("\n")
);

console.log(`Converted ${lessons.length} lessons, ${allTerms.length} terms, ${allPhrases.length} phrases.`);
