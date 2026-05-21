import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();
// 新位置：cwd 是 projects/4-sap-training/web，源在 ../SAP日语培训/output
const sourceRoot = path.resolve(root, "../SAP日语培训/output");
const dataDir = path.join(root, "data");
const logsDir = path.resolve(root, "../../../logs");

// Phase 1: Level 推断（按 lesson.order 1-24 分布）
// 1-2 → 体验；3-6 → 生存；7-18 → 核心场景；19-24 → 模块专题
function inferLevel(order) {
  if (order <= 2) return "L0-trial";
  if (order <= 6) return "L1-survival";
  if (order <= 18) return "L2-core";
  return "L3-module";
}

// v4 单课聚焦版素材根（与 sourceRoot 同级的兄弟目录）
const v4Root = path.resolve(root, "../sap_jp_training_course/output");

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

function buildLessonAssets(lessonId, lessonOrder) {
  // lessonId 形如 "lesson_01"；lessonOrder 1-24
  const numStr = String(lessonOrder).padStart(2, "0");
  const assets = [];

  function tryPush(kind, absPath, title, visibility) {
    if (!fs.existsSync(absPath)) return;
    const md = fs.readFileSync(absPath, "utf8");
    if (!md.trim()) return;
    assets.push({
      kind,
      title,
      // path 字段存相对 sap-hub 仓库根的路径，便于追溯（不嵌入仓库实际硬路径）
      path: path.relative(path.resolve(root, "../../.."), absPath),
      markdown: md,
      wordCount: md.length,
      visibility,
    });
  }

  // 11 大目录素材
  tryPush(
    "course-design",
    path.join(sourceRoot, "01_单课课程设计稿", `lesson_${numStr}_SAP日语培训课程设计稿.md`),
    "课程设计稿",
    "both"
  );
  tryPush(
    "classroom-transcript",
    path.join(sourceRoot, "02_单课日语课堂逐字稿", `lesson_${numStr}_SAP日语课堂逐字稿.md`),
    "课堂逐字稿",
    "both"
  );
  tryPush(
    "practice-homework",
    path.join(sourceRoot, "03_单课练习与作业", `lesson_${numStr}_练习与作业.md`),
    "练习与作业",
    "student"
  );
  tryPush(
    "review-checklist",
    path.join(sourceRoot, "09_待复核清单", `lesson_${numStr}_待复核清单.md`),
    "待复核清单",
    "both"
  );

  // 11_24课独立课程包/lesson_XX/00_README*.md
  const pkgDir = path.join(sourceRoot, "11_24课独立课程包", `lesson_${numStr}`);
  if (fs.existsSync(pkgDir)) {
    const readme = fs.readdirSync(pkgDir).find((f) => /^00_README/.test(f));
    if (readme) {
      tryPush(
        "package-readme",
        path.join(pkgDir, readme),
        "独立课程包 README",
        "student"
      );
    }
  }

  // v4 单课聚焦版（在 ../sap_jp_training_course/output/lesson_XX_v4_teacher_focused/ 下）
  const v4Dir = path.join(v4Root, `lesson_${numStr}_v4_teacher_focused`);
  if (fs.existsSync(v4Dir)) {
    tryPush(
      "teacher-script-v4",
      path.join(v4Dir, "01_teacher_core", "01_teacher_full_script_slide_by_slide.md"),
      "讲师逐字稿（v4）",
      "teacher"
    );
    tryPush(
      "student-ppt-v4",
      path.join(v4Dir, "02_student_materials", "01_student_ppt_outline_final.md"),
      "学生 PPT 大纲（v4）",
      "student"
    );
    tryPush(
      "classroom-workbook-v4",
      path.join(v4Dir, "03_classroom_practice", "01_classroom_workbook_roleplay.md"),
      "课堂练习 + RolePlay（v4）",
      "student"
    );
    tryPush(
      "case-pack-v4",
      path.join(v4Dir, "04_case_pack", "01_case_pack_appendix_all_modules.md"),
      "案例包附录（v4，多模块）",
      "teacher"
    );
    tryPush(
      "quality-check-v4",
      path.join(v4Dir, "06_management", "02_quality_check_teacher_usability.md"),
      "质量审查（v4）",
      "teacher"
    );
  }

  return assets;
}

function buildTracks() {
  const tracks = [
    {
      id: "jp-foundation",
      title: "SAP 日本项目语言战斗力训练营 · 基础线",
      description: "面向中国 SAP 顾问进入日本项目的基础语言训练，覆盖 L0 体验 → L1 生存 → L2 核心场景 → L3 模块专题，24 课。",
      level: "L2-core",
      durationLabel: "24 课 · 约 8 周",
      status: "active",
      order: 1,
    },
  ];
  writeJson("tracks.json", tracks);
  return tracks;
}

function buildLibrary() {
  // 11 大目录里 6 个跨课总表
  const items = [
    {
      kind: "glossary-master",
      title: "SAP 日语高频术语总表",
      sourceDir: "04_术语表",
      sourceFile: "SAP日语高频术语总表.md",
      visibility: "both",
    },
    {
      kind: "phrasebook-master",
      title: "SAP 日语高频句型总表",
      sourceDir: "05_句型库",
      sourceFile: "SAP日语高频句型总表.md",
      visibility: "both",
    },
    {
      kind: "roleplay-master",
      title: "SAP 日语 RolePlay 总合集",
      sourceDir: "06_RolePlay脚本",
      sourceFile: "SAP日语RolePlay总合集.md",
      visibility: "both",
    },
    {
      kind: "teacher-handbook",
      title: "SAP 日语培训讲师手册",
      sourceDir: "07_讲师手册",
      sourceFile: "SAP日语培训讲师手册.md",
      visibility: "teacher",
    },
    {
      kind: "student-handbook",
      title: "SAP 日语培训学生讲义",
      sourceDir: "08_学生讲义",
      sourceFile: "SAP日语培训学生讲义.md",
      visibility: "student",
    },
    {
      kind: "quality-report",
      title: "全课程质量审查报告",
      sourceDir: "10_质量审查",
      sourceFile: "全课程质量审查报告.md",
      visibility: "teacher",
    },
  ];

  const library = [];
  for (const item of items) {
    const abs = path.join(sourceRoot, item.sourceDir, item.sourceFile);
    if (!fs.existsSync(abs)) continue;
    const md = fs.readFileSync(abs, "utf8");
    if (!md.trim()) continue;
    library.push({
      kind: item.kind,
      title: item.title,
      path: path.relative(path.resolve(root, "../../.."), abs),
      markdown: md,
      wordCount: md.length,
      visibility: item.visibility,
    });
  }
  writeJson("library.json", library);
  return library;
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

function phraseAudio(phraseId) {
  return `/audio/phrase/${phraseId}.mp3`;
}

function shadowingAudio(shadowingId) {
  return `/audio/shadowing/${shadowingId}.mp3`;
}

const chineseOnlyParticles = /[呢吧啊嘛吗哈哟啦哦呀]/;
const simplifiedChineseSignals = /[这课顾问概览成员根据角色分工进入议题业务现状课题要望流程配置测试问题会议输出学习目标完成说明处理范围差异影响步骤用户项目后续已经暂无课堂练习作业词汇句型请核心模块需求讲师学生]/;
const chineseInstructionPattern = /(如果|学生说|请改成|讲师|学生|第一遍|第二遍|中文|错误|改法|课堂|练习|作业)/;
const negativeExamplePattern = /(错误|中式|初级表达|初級表現|悪い例|NG|直接否定|問題表現)/;
const jpMarker = /(です|ます|ください|でしょう|ましょう|ません|だ。|た。|る。|る$|ない|から|まで|について|として|に対して|に関して|を確認|を教えて|していきます|していただ|させていただ|になります|いたしました|でしょうか|ございます|お願いいたします|と思います|考えております)/;

function hasLongChinesePhrase(s) {
  const normalized = s.replace(/[A-Za-z0-9/・ー％%（）()【】「」『』.,:：;；\s]/g, " ");
  const runs = normalized.match(/[\u4e00-\u9fff]{6,}/g) ?? [];
  return runs.some((run) => simplifiedChineseSignals.test(run));
}

function isRealJapanese(line) {
  const s = line.trim();
  if (s.length < 8) return false;
  if (chineseOnlyParticles.test(s)) return false;
  if (chineseInstructionPattern.test(s)) return false;
  if (!jpMarker.test(s)) return false;
  if (!/[。？！?!.]$/.test(s)) return false;
  if (/^[-*•・]/.test(s)) return false;
  if (hasLongChinesePhrase(s)) return false;
  return true;
}

function cleanMarkdownLine(raw) {
  let s = raw
    .replace(/^\s*[-*•・]\s*/, "")
    .replace(/^\s*\d+[.)．]\s*/, "")
    .replace(/^#+\s+/, "")
    .replace(/`/g, "")
    .replace(/^\s*>\s*/, "")
    .replace(/\*\*/g, "")
    .replace(/^（[^）]*）/, "")
    .replace(/^(?:[A-Z]|板書|例|日语|日本語|顾问|客户|講師|学生|参考答案)\s*[:：]\s*/, "")
    .trim();
  for (let i = 0; i < 2; i += 1) {
    const prefix = s.match(/^([^:：]{1,40})[:：]\s*(.+)$/);
    if (!prefix) break;
    if (/[\u3040-\u30ff]/.test(prefix[1])) break;
    if (/[\u4e00-\u9fff]/.test(prefix[1])) {
      s = prefix[2].trim();
      continue;
    }
    break;
  }
  return s;
}

function realSentenceSources(lessonId, order) {
  const numStr = String(order).padStart(2, "0");
  return [
    path.join(v4Root, `lesson_${numStr}_v4_teacher_focused/01_teacher_core/01_teacher_full_script_slide_by_slide.md`),
    path.join(v4Root, `lesson_${numStr}_v4_teacher_focused/02_student_materials/01_student_ppt_outline_final.md`),
    path.join(v4Root, `lesson_${numStr}_v4_teacher_focused/03_classroom_practice/01_classroom_workbook_roleplay.md`),
    path.join(v4Root, `lesson_${numStr}_v4_teacher_focused/04_case_pack/01_case_pack_appendix_all_modules.md`),
    path.join(sourceRoot, `01_单课课程设计稿/${lessonId}_SAP日语培训课程设计稿.md`),
    path.join(sourceRoot, `02_单课日语课堂逐字稿/${lessonId}_SAP日语课堂逐字稿.md`)
  ];
}

function extractRealSentences(lessonId, order) {
  const sentences = new Map();
  for (const src of realSentenceSources(lessonId, order)) {
    if (!fs.existsSync(src)) continue;
    const md = fs.readFileSync(src, "utf8");
    for (const raw of md.split(/\r?\n/)) {
      if (negativeExamplePattern.test(raw)) continue;
      const cleaned = cleanMarkdownLine(raw);
      const parts = cleaned.split(/(?<=[。？！])/);
      for (const part of parts) {
        const candidate = part.trim();
        if (isRealJapanese(candidate) && !sentences.has(candidate)) {
          sentences.set(candidate, { text: candidate, source: src });
        }
      }
    }
  }
  return Array.from(sentences.values());
}

function inferCategory(text) {
  if (/確認|理解|よろしいでしょうか|前提|対象範囲/.test(text)) return "requirement-confirmation";
  if (/影響範囲|観点|リスク|内部統制|会計連携|標準/.test(text)) return "scope-management";
  if (/共有|説明|次回|持ち帰|お願いいたします/.test(text)) return "next-step";
  if (/テスト|UAT|検証|不具合|障害/.test(text)) return "testing";
  if (/設定|マスタ|権限|画面|システム/.test(text)) return "configuration";
  return "meeting";
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

function buildPhrases(lessonId, order) {
  const real = extractRealSentences(lessonId, order);
  return real.slice(0, 20).map((sentence, index) => {
    const idx = index + 1 + (order - 1) * 30;
    const id = `${lessonId}-phrase-${String(idx).padStart(3, "0")}`;
    return {
      id,
      lessonId,
      category: inferCategory(sentence.text),
      japanese: sentence.text,
      chinese: "",
      usage: "项目场景",
      replaceableParts: [],
      exampleVariations: [],
      audioSrc: phraseAudio(id),
      sourcePath: path.relative(path.resolve(root, "../../.."), sentence.source)
    };
  });
}

function buildShadowingItems(lessonId, phrases) {
  return phrases.slice(0, 20).map((phrase, index) => {
    const id = `${lessonId}-shadow-${String(index + 1).padStart(2, "0")}`;
    return {
      id,
      lessonId,
      japanese: phrase.japanese,
      chinese: phrase.chinese,
      scenario: phrase.category,
      audioSrc: shadowingAudio(id),
      requiredRepeats: 3
    };
  });
}

function roleFromLabel(label) {
  const s = label.replace(/\s+/g, " ").trim();
  if (/^A$/i.test(s)) return "A";
  if (/^B$/i.test(s)) return "B";
  if (/^(顾问|顧問|Consultant|講師|讲师|SAP\s*顾问|SAP\s*顧問|模块顾问|モジュール|PM|PMO)/i.test(s)) return "A";
  if (/^(客户|客戶|Customer|Key User|业务用户|業務ユーザー|ユーザー|お客様|客户侧用户|学生)/i.test(s)) return "B";
  return null;
}

function roleFromContext(context) {
  if (/(客户|客戶|Customer|Key User|業務|业务|ユーザー|お客様|客户台词)/i.test(context)) return "B";
  if (/(顾问|顧問|Consultant|参考回应|参考答案|改写|標準|标准|跟读|熱身|热身|句型|模块|モジュール)/i.test(context)) return "A";
  return null;
}

function cleanRoleplayText(raw) {
  let text = cleanMarkdownLine(raw)
    .replace(/\s*\/\s*/g, "")
    .replace(/^[「『"“](.+)[」』"”]$/, "$1")
    .replace(/\s+/g, " ")
    .trim();
  for (let i = 0; i < 2; i += 1) {
    const quoted = text.match(/^[「『"“](.+)[」』"”]$/);
    if (!quoted) break;
    text = quoted[1].trim();
  }
  return text;
}

function pushJapaneseTurns(turns, seen, role, raw) {
  const text = cleanRoleplayText(raw);
  for (const part of text.split(/(?<=[。？！!?])\s*/)) {
    const candidate = part.trim();
    const key = `${role}:${candidate}`;
    if (isRealJapanese(candidate) && !seen.has(key)) {
      turns.push({ role, text: candidate });
      seen.add(key);
    }
  }
}

function parseTableCells(raw) {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return null;
  if (/^\|\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|$/.test(trimmed)) return null;
  return trimmed
    .slice(1, -1)
    .split("|")
    .map((cell) => cell.replace(/<br\s*\/?>/gi, "\n").replace(/\*\*/g, "").trim());
}

function buildRoleplays(lessonId, order, phrases = []) {
  const numStr = String(order).padStart(2, "0");
  const rpSrc = path.join(v4Root, `lesson_${numStr}_v4_teacher_focused/03_classroom_practice/01_classroom_workbook_roleplay.md`);
  if (!fs.existsSync(rpSrc)) return [];
  const md = fs.readFileSync(rpSrc, "utf8");
  const turns = [];
  const fallbackTurns = [];
  const turnSeen = new Set();
  const fallbackSeen = new Set();
  const lines = md.split(/\r?\n/);
  let currentHeading = "";
  let pendingRole = null;
  let inFence = false;
  let fenceRole = null;

  for (const raw of lines) {
    const heading = raw.match(/^#{2,4}\s+(.+)$/);
    if (heading) currentHeading = heading[1].trim();

    if (/^\s*```/.test(raw)) {
      inFence = !inFence;
      fenceRole = inFence ? pendingRole ?? roleFromContext(currentHeading) : null;
      pendingRole = null;
      continue;
    }

    if (inFence) {
      if (fenceRole) {
        pushJapaneseTurns(turns, turnSeen, fenceRole, raw);
      } else if (roleFromContext(currentHeading)) {
        pushJapaneseTurns(turns, turnSeen, roleFromContext(currentHeading), raw);
      }
      continue;
    }

    const labelOnly = raw.match(/^\s*(客户|客戶|顾问|顧問|Customer|Consultant|Key User|业务用户|業務ユーザー|ユーザー|お客様|A|B)\s*[:：]\s*$/i);
    if (labelOnly) {
      pendingRole = roleFromLabel(labelOnly[1]);
      continue;
    }

    const colonMatch = raw.match(/^\s*(?:[-*•・]\s*)?\*?\*?(A|B|顾问|顧問|客户|客戶|Key User|业务用户|業務ユーザー|Consultant|Customer|ユーザー|お客様)\s*[:：]\*?\*?\s*(.+)$/i);
    if (colonMatch) {
      const role = roleFromLabel(colonMatch[1]);
      if (role) pushJapaneseTurns(turns, turnSeen, role, colonMatch[2]);
      continue;
    }

    const cells = parseTableCells(raw);
    if (cells) {
      const role = roleFromLabel(cells[0] ?? "");
      if (role) {
        for (const cell of cells.slice(1)) pushJapaneseTurns(turns, turnSeen, role, cell);
      } else {
        for (const cell of cells) pushJapaneseTurns(fallbackTurns, fallbackSeen, "A", cell);
      }
      continue;
    }

    if (!negativeExamplePattern.test(raw)) {
      pushJapaneseTurns(fallbackTurns, fallbackSeen, "A", raw);
    }
  }

  const hasRoleA = turns.some((turn) => turn.role === "A");
  const hasRoleB = turns.some((turn) => turn.role === "B");
  const merged = [];
  const mergedSeen = new Set();
  for (const turn of turns.concat(fallbackTurns)) {
    const key = `${turn.role}:${turn.text}`;
    if (!mergedSeen.has(key)) {
      merged.push(turn);
      mergedSeen.add(key);
    }
  }
  let sourceTurns = turns.length >= 4 && hasRoleA && hasRoleB ? turns : merged;
  if (sourceTurns.length < 4) {
    sourceTurns = phrases
      .map((phrase) => cleanRoleplayText(phrase.japanese))
      .filter((text) => isRealJapanese(text))
      .slice(0, 8)
      .map((text) => ({ role: "A", text }));
  }
  if (sourceTurns.length < 4) return [];

  const out = [];
  const half = Math.ceil(sourceTurns.length / 2);
  const groups = sourceTurns.length >= 8 ? [sourceTurns.slice(0, half), sourceTurns.slice(half)] : [sourceTurns];
  groups.forEach((group, index) => {
    const slice = group.slice(0, 12);
    if (slice.length < 4) return;
    out.push({
      id: `${lessonId}-roleplay-${index + 1}`,
      lessonId,
      title: `Role Play ${index + 1}`,
      scenario: "项目现场",
      roleA: "SAP 顾问",
      roleB: "业务用户 / Key User",
      requiredPhrases: [],
      dialogue: slice
    });
  });
  return out;
}

function buildSubstitutionDrills() {
  return [];
}

function scanFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? scanFiles(full) : [full];
  });
}

function writeContentSourceReport(lessonsStats) {
  const lines = [
    "# 内容来源真实性报告",
    "",
    `生成时间：${new Date().toISOString()}`,
    "",
    "本报告记录每课从真实素材抽到的句子数，遵循 N 节真实性硬底线，不编造。",
    "",
    "| Lesson | Phrases | Shadowing | RolePlays | 真句源命中 | 备注 |",
    "|---|---|---|---|---|---|",
  ];
  let totalPhrases = 0;
  let totalShadowing = 0;
  const zeroLessons = [];
  for (const lesson of lessonsStats) {
    lines.push(`| ${lesson.id} | ${lesson.phrases} | ${lesson.shadowing} | ${lesson.roleplays} | ${lesson.realCount} | ${lesson.note ?? ""} |`);
    totalPhrases += lesson.phrases;
    totalShadowing += lesson.shadowing;
    if (lesson.realCount === 0) zeroLessons.push(lesson.id);
  }
  lines.push("");
  lines.push(`**合计**：phrases ${totalPhrases} / shadowing ${totalShadowing}`);
  if (zeroLessons.length > 0) {
    lines.push("");
    lines.push(`**0 真句课次**（已诚实跳过，不编造）：${zeroLessons.join(", ")}`);
  }
  const reportPath = path.join(logsDir, "content-source-report.md");
  fs.writeFileSync(reportPath, `${lines.join("\n")}\n`);
  console.log("Wrote", reportPath);
}

function sourceCommit() {
  try {
    return execSync("git rev-parse HEAD", { cwd: path.resolve(root, "../../.."), encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

function buildMeta(stats) {
  writeJson("_meta.json", {
    schemaVersion: "1.1.0",
    generatedAt: new Date().toISOString(),
    sourceCommit: sourceCommit(),
    stats,
    audio: {
      provider: process.env.TTS_PROVIDER ?? "azure",
      voice: process.env.AZURE_TTS_VOICE ?? "ja-JP-NanamiNeural",
      generated: false
    },
    notes: [
      "Chinese translation fields for phrases/shadowing are intentionally empty.",
      "Never fabricate Japanese or Chinese translations; see Phase 3 子任务 1.",
      "Audio mp3 files are .gitignore'd; run `npm run tts` after providing creds.",
      "Phase 3 selected TTS path C: script only, no mp3 generation in this commit."
    ]
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

const allPhrases = [];
const allRoleplays = [];

const lessons = [];
const allTerms = [];
const allAssignments = [];
const conversionNotes = [];
const insufficientLessons = [];
const lessonsWithStats = [];

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
  const realSentences = extractRealSentences(lessonId, order);
  const lessonPhrases = buildPhrases(lessonId, order);
  const terms = parseTermsFromDesign(designMarkdown, lessonId, reviewSet);
  const finalOutputTask = parseLineValue(designMarkdown, "本课最终输出任务");
  const microTrainings = parseMicroTrainings(assignmentMarkdown || designMarkdown, lessonId);
  const consultantOutputs = parseConsultantOutputs(assignmentMarkdown || designMarkdown, lessonId);
  const assignments = parseAssignmentTasks(assignmentMarkdown, lessonId, finalOutputTask);
  const lessonRoleplays = buildRoleplays(lessonId, order, lessonPhrases);
  const shadowingItems = buildShadowingItems(lessonId, lessonPhrases);
  const reviewItems = reviewByLesson.get(lessonId) ?? [];
  const assets = buildLessonAssets(lessonId, order);
  const substitutionDrills = buildSubstitutionDrills();
  lessonsWithStats.push({
    id: lessonId,
    phrases: lessonPhrases.length,
    shadowing: shadowingItems.length,
    roleplays: lessonRoleplays.length,
    realCount: realSentences.length,
    note: realSentences.length === 0 ? "源文件未抽到合格真句，已跳过" : ""
  });

  if (terms.length < 5 || lessonPhrases.length < 5 || lessonRoleplays.length < 1 || shadowingItems.length < 5) {
    insufficientLessons.push(`${lessonId} ${title}: terms=${terms.length}, phrases=${lessonPhrases.length}, shadowing=${shadowingItems.length}, roleplays=${lessonRoleplays.length}`);
  }

  const lesson = {
    id: lessonId,
    title,
    order,
    trackId: "jp-foundation",
    level: inferLevel(order),
    assets,
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
    substitutionDrills,
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
  allPhrases.push(...lessonPhrases);
  allRoleplays.push(...lessonRoleplays);
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
const lessonAssetTotal = lessons.reduce((sum, lesson) => sum + lesson.assets.length, 0);
const lessonAssetAverage = lessons.length ? (lessonAssetTotal / lessons.length).toFixed(1) : "0.0";

const tracks = buildTracks();
const libraryItems = buildLibrary();
writeJson("lessons.json", lessons);
writeJson("glossary.json", allTerms);
writeJson("phrases.json", allPhrases);
writeJson("roleplays.json", allRoleplays);
writeJson("assignments.json", allAssignments);
writeJson("review-terms.json", reviewTerms);
writeContentSourceReport(lessonsWithStats);
buildMeta({
  tracks: tracks.length,
  lessons: lessons.length,
  phrases: allPhrases.length,
  shadowing: lessons.reduce((sum, lesson) => sum + lesson.shadowingItems.length, 0),
  roleplays: allRoleplays.length,
  glossaryTerms: allTerms.length,
  libraryItems: libraryItems.length,
  totalAssets: lessonAssetTotal
});

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
    `- 共生成 LessonAsset：${lessonAssetTotal}（平均每课 ${lessonAssetAverage} 份）`,
    "",
    "## 内容不足课程",
    "",
    ...(insufficientLessons.length ? insufficientLessons.map((item) => `- ${item}`) : ["- 无，24 课均达到 MVP 训练站数据要求。"]),
    "",
    "## 说明",
    "",
    "- 可播放训练句的 audioSrc 已指向最终目标 `/audio/phrase/*.mp3` 与 `/audio/shadowing/*.mp3`；Phase 3 选 C，mp3 由 Ryan 后续手动 TTS 生成。",
    "- 句型、Shadowing、Role Play 只从真实课程 Markdown 抽取；中文翻译字段留空，不编造。",
    "- Substitution drill 暂返回空数组，等待后续 Phase 做真句替换识别。",
    "- 录音作业 MVP 使用浏览器 IndexedDB 保存，不上传服务器。",
    "- 待复核术语来自课程输出目录的待复核总表，状态统一初始化为 pending。",
    ""
  ].join("\n")
);

console.log(`Converted ${lessons.length} lessons, ${allTerms.length} terms, ${allPhrases.length} phrases.`);
