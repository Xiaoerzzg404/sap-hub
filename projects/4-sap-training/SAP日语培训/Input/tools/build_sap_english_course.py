#!/usr/bin/env python3
"""Batch transcribe SAP English training videos and build lesson documents.

The script is intentionally local-first: it uses ffprobe for metadata,
mlx-whisper for ASR, and Python standard-library logic for Markdown outputs.
"""

from __future__ import annotations

import argparse
import collections
import datetime as dt
import json
import math
import os
import re
import subprocess
import sys
from pathlib import Path
from typing import Iterable


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "_outputs"
RAW_DIR = OUT / "transcripts_raw"
MD_DIR = OUT / "transcripts_md"
GUIDE_DIR = OUT / "course_guides"
REPORT_DIR = OUT / "reports"
OCR_DIR = OUT / "visual_ocr"

MODEL = "mlx-community/whisper-large-v3-turbo"
ASR_PROMPT = (
    "这是SAP顾问英语培训课，中英混合。老师和学生主要用中文讲解、用英文练习。"
    "请保留英文术语和SAP顾问常用表达，例如 SAP, consultant, client, customer, "
    "requirement, implementation, configuration, customization, FICO, FI, CO, SD, MM, "
    "S/4HANA, SAP GUI, Fiori, invoice, payment, purchase order, sales order, "
    "month-end close, business process, project, kickoff, go-live, hypercare。"
    "不要翻译成日文，不要输出日文。"
)

SAP_TERMS = {
    "SAP",
    "S/4HANA",
    "Fiori",
    "SAP GUI",
    "GUI",
    "FICO",
    "FI",
    "CO",
    "SD",
    "MM",
    "PP",
    "client",
    "customer",
    "consultant",
    "requirement",
    "configuration",
    "customization",
    "implementation",
    "business process",
    "process",
    "project",
    "kickoff",
    "blueprint",
    "design",
    "realization",
    "testing",
    "UAT",
    "training",
    "go-live",
    "hypercare",
    "support",
    "login",
    "logout",
    "log in",
    "log out",
    "invoice",
    "payment",
    "purchase order",
    "sales order",
    "master data",
    "transaction data",
    "month-end close",
    "migration",
    "transport",
    "user",
    "role",
    "authorization",
}

TERM_STOPWORDS = {
    "a",
    "an",
    "and",
    "are",
    "be",
    "for",
    "from",
    "i",
    "in",
    "is",
    "it",
    "of",
    "ok",
    "okay",
    "so",
    "that",
    "the",
    "there",
    "this",
    "to",
    "very",
    "what",
    "why",
    "yes",
    "you",
}

CATEGORY_RULES = [
    (
        "SAP系统登录与基础导航",
        ["login", "logout", "log in", "log out", "SAP GUI", "GUI", "Fiori", "系统", "登录", "退出", "字段", "软件"],
        [
            "把语言练习落到真实顾问场景：请 IT 安装 SAP GUI、告诉用户如何 log in/log out、解释 client/user/password/transaction 字段。",
            "建议让学生用英文完成一个 30 秒 micro training：先说明目的，再一步步带用户进入系统，最后确认用户是否能自己操作。",
        ],
    ),
    (
        "项目实施方法论与顾问角色",
        ["implementation", "methodology", "project", "kickoff", "blueprint", "design", "realization", "go-live", "hypercare", "项目", "实施", "方法论", "上线"],
        [
            "补充标准顾问叙述框架：kickoff -> requirement gathering/design -> configuration -> testing/UAT -> training -> go-live -> hypercare。",
            "训练学生不要只背单词，而是用英语解释自己在项目每个阶段负责什么、交付什么、如何和客户确认。",
        ],
    ),
    (
        "需求访谈与客户沟通",
        ["requirement", "client", "customer", "user", "沟通", "需求", "用户", "客户", "确认", "会议", "interview", "workshop"],
        [
            "讲师可强化三句顾问英语：Could you walk me through the current process? / Let me confirm my understanding. / What is the expected output?",
            "练习重点是从中文业务问题切换成英文澄清问题，输出要包含确认、追问、复述、下一步行动。",
        ],
    ),
    (
        "配置、主数据与业务流程解释",
        ["configuration", "customization", "master data", "transaction data", "process", "invoice", "payment", "PO", "SO", "配置", "主数据", "流程", "发票", "付款", "订单"],
        [
            "建议区分 configuration/customization、master data/transaction data、process step/output，避免学生把所有动作都说成 do SAP。",
            "让学生练习用英文解释一个流程节点：输入是什么、系统动作是什么、输出单据或报表是什么。",
        ],
    ),
    (
        "课堂表达与口语输出训练",
        ["怎么说", "英文", "练习", "同学", "回答", "读", "role play", "repeat", "sentence", "phrase", "expression"],
        [
            "讲师可把本段内容改造成 shadowing + substitution drill：先跟读，再替换角色、系统对象、业务场景。",
            "输出评价建议看三点：SAP术语是否准确、句子是否能用于真实会议、是否说出了 input/output/next step。",
        ],
    ),
]

QUESTION_HINTS = [
    "吗",
    "?",
    "？",
    "怎么说",
    "知道",
    "同学",
    "回答",
    "试",
    "练习",
    "读",
    "来说",
    "role play",
    "repeat",
]


def run(cmd: list[str], *, cwd: Path = ROOT, check: bool = True) -> subprocess.CompletedProcess[str]:
    print("+ " + " ".join(cmd), flush=True)
    return subprocess.run(cmd, cwd=cwd, check=check, text=True)


def ensure_dirs() -> None:
    for path in [RAW_DIR, MD_DIR, GUIDE_DIR, REPORT_DIR, OCR_DIR]:
        path.mkdir(parents=True, exist_ok=True)


def ffprobe(video: Path) -> dict[str, float | int]:
    cmd = [
        "ffprobe",
        "-v",
        "error",
        "-show_entries",
        "format=duration,size",
        "-of",
        "json",
        str(video),
    ]
    data = json.loads(subprocess.check_output(cmd, cwd=ROOT, text=True))
    fmt = data["format"]
    return {"duration": float(fmt["duration"]), "size": int(fmt["size"])}


def find_videos() -> list[Path]:
    videos = sorted(ROOT.glob("**/*.mp4"), key=sort_key)
    return [p for p in videos if "_outputs" not in p.parts]


def sort_key(path: Path) -> tuple[int, int, str]:
    text = str(path)
    m = re.search(r"第\s*(\d+)(?:-(\d+))?\s*节", text)
    if not m:
        m = re.search(r"第\s*(\d+)(?:-(\d+))?\s*课", text)
    start = int(m.group(1)) if m else 999
    end = int(m.group(2)) if m and m.group(2) else start
    return (start, end, text)


def lesson_slug(path: Path, seen: collections.Counter[str]) -> str:
    rel = path.relative_to(ROOT)
    text = str(rel)
    lesson = re.search(r"第\s*(\d+)(?:-(\d+))?\s*节", text)
    if not lesson:
        lesson = re.search(r"第\s*(\d+)(?:-(\d+))?\s*课", text)
    if lesson:
        start = int(lesson.group(1))
        end = int(lesson.group(2)) if lesson.group(2) else start
        lesson_part = f"lesson_{start:02d}" if start == end else f"lesson_{start:02d}_{end:02d}"
    else:
        lesson_part = "lesson_unknown"
    date = re.search(r"(20\d{6})", text)
    date_part = date.group(1) if date else "nodate"
    stem = sanitize(path.stem)
    base = f"{lesson_part}_{date_part}_{stem}"
    seen[base] += 1
    if seen[base] > 1:
        base = f"{base}_{seen[base]}"
    return base[:180]


def sanitize(value: str) -> str:
    value = re.sub(r"[\\/:*?\"<>|]+", "_", value)
    value = re.sub(r"\s+", "_", value)
    value = re.sub(r"_+", "_", value)
    return value.strip("._")


def hms(seconds: float) -> str:
    seconds = max(0, int(round(seconds)))
    h = seconds // 3600
    m = (seconds % 3600) // 60
    s = seconds % 60
    return f"{h:02d}:{m:02d}:{s:02d}"


def md_escape(text: str) -> str:
    return text.replace("|", "\\|").strip()


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def transcribe(video: Path, slug: str, force: bool = False) -> None:
    json_path = RAW_DIR / f"{slug}.json"
    if json_path.exists() and not force:
        print(f"skip existing transcript: {json_path.relative_to(ROOT)}", flush=True)
        return
    cmd = [
        "uvx",
        "--from",
        "mlx-whisper",
        "mlx_whisper",
        str(video),
        "--model",
        MODEL,
        "--output-dir",
        str(RAW_DIR),
        "--output-name",
        slug,
        "--output-format",
        "all",
        "--task",
        "transcribe",
        "--language",
        "zh",
        "--verbose",
        "False",
        "--condition-on-previous-text",
        "False",
        "--initial-prompt",
        ASR_PROMPT,
    ]
    run(cmd)


def split_sentences(text: str) -> list[str]:
    raw = re.split(r"(?<=[。！？!?])\s*|\n+", text)
    return [s.strip(" ，,。") for s in raw if len(s.strip()) >= 6]


def english_terms(text: str, limit: int = 18) -> list[str]:
    candidates = []
    lower_text = text.lower()
    for term in SAP_TERMS:
        if term.lower() in lower_text:
            candidates.append(term)
    pattern = re.compile(r"\b[A-Za-z][A-Za-z0-9/+.\-]*(?:[ \t]+[A-Za-z][A-Za-z0-9/+.\-]*){0,3}\b")
    for match in pattern.finditer(text):
        value = re.sub(r"\s+", " ", match.group(0)).strip(" '\"`.,:;!?()[]{}")
        if len(value) < 2:
            continue
        lowered = value.lower()
        words = lowered.split()
        if lowered in TERM_STOPWORDS:
            continue
        if words and sum(1 for word in words if word in TERM_STOPWORDS) / len(words) > 0.5:
            continue
        if re.search(r"\b[a-z]\b", lowered) and value not in SAP_TERMS:
            continue
        if not any(ch.isupper() for ch in value) and value not in SAP_TERMS and len(words) <= 1:
            continue
        candidates.append(value)
    counter = collections.Counter(candidates)
    return [term for term, _ in counter.most_common(limit)]


def categories_for(text: str) -> list[tuple[str, list[str]]]:
    lowered = text.lower()
    result = []
    for name, keys, notes in CATEGORY_RULES:
        if any(k.lower() in lowered for k in keys):
            result.append((name, notes))
    if not result:
        result.append(("课堂推进与复盘", ["讲师可先把本段内容压缩成一个真实顾问场景，再要求学生用 2-3 句英文说清楚背景、动作和结果。"]))
    return result


def representative_sentences(text: str, limit: int = 4) -> list[str]:
    sentences = split_sentences(text)
    if not sentences:
        return []
    keywords = [
        "SAP",
        "系统",
        "项目",
        "顾问",
        "客户",
        "用户",
        "需求",
        "流程",
        "英文",
        "怎么",
        "练习",
        "输入",
        "输出",
        "implementation",
        "requirement",
        "configuration",
        "process",
        "client",
        "customer",
    ]
    scored = []
    for idx, sentence in enumerate(sentences):
        score = sum(sentence.lower().count(k.lower()) for k in keywords)
        score += min(len(sentence), 120) / 200.0
        if "?" in sentence or "？" in sentence:
            score += 1.0
        scored.append((score, idx, sentence))
    picked = sorted(scored, reverse=True)[:limit]
    return [s for _, _, s in sorted(picked, key=lambda item: item[1])]


def practice_lines(segments: list[dict], limit: int = 5) -> list[str]:
    lines = []
    for seg in segments:
        text = seg.get("text", "").strip()
        if any(hint.lower() in text.lower() for hint in QUESTION_HINTS):
            lines.append(f"{hms(seg['start'])} {text}")
    return lines[:limit]


def build_blocks(segments: list[dict], minutes: int = 10) -> list[dict]:
    blocks: list[dict] = []
    if not segments:
        return blocks
    duration = max(float(s.get("end", 0)) for s in segments)
    block_size = minutes * 60
    total = max(1, math.ceil(duration / block_size))
    for idx in range(total):
        start = idx * block_size
        end = min((idx + 1) * block_size, duration)
        block_segments = [
            s for s in segments if float(s.get("start", 0)) < end and float(s.get("end", 0)) >= start
        ]
        text = "\n".join(s.get("text", "").strip() for s in block_segments)
        blocks.append({"start": start, "end": end, "segments": block_segments, "text": text})
    return blocks


def make_transcript_md(video: Path, slug: str, meta: dict, transcript: dict) -> str:
    segments = transcript.get("segments", [])
    lines = [
        f"# {video.stem} 逐字稿",
        "",
        f"- source_file: `{video.relative_to(ROOT)}`",
        f"- duration: `{hms(float(meta['duration']))}`",
        f"- asr_model: `{MODEL}`",
        "- language_policy: 中文讲解和英文课程内容保留原样；未翻译成日文。",
        "- review_state: `machine_transcript_needs_human_review`",
        "",
        "## 说明",
        "",
        "这是本地 Whisper 自动转录结果。它适合做课程复盘和二次整理，但 SAP 专有名词、学生姓名、低音量抢话处需要人工复核。",
        "",
        "## 逐字稿",
        "",
    ]
    for seg in segments:
        lines.append(f"### {hms(seg['start'])} - {hms(seg['end'])}")
        lines.append("")
        lines.append(seg.get("text", "").strip())
        lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def make_guide_md(video: Path, slug: str, meta: dict, transcript: dict) -> str:
    segments = transcript.get("segments", [])
    full_text = "\n".join(s.get("text", "").strip() for s in segments)
    terms = english_terms(full_text, 30)
    overall_sentences = representative_sentences(full_text, 8)
    overall_categories = categories_for(full_text)
    transcript_link = Path("../transcripts_md") / f"{slug}_逐字稿.md"
    raw_link = Path("../transcripts_raw") / f"{slug}.json"
    ocr_items = load_ocr(slug)
    blocks = build_blocks(segments, minutes=10)
    lines = [
        f"# {video.stem} 时间线培训教程",
        "",
        f"- source_file: `{video.relative_to(ROOT)}`",
        f"- duration: `{hms(float(meta['duration']))}`",
        f"- transcript_md: `{transcript_link}`",
        f"- transcript_json: `{raw_link}`",
        "- review_state: `draft_from_machine_transcript_needs_human_review`",
        "",
        "## 本课定位",
        "",
        "本文件把原课转成讲师可复盘、可二次授课的 SAP 顾问英语训练稿。重点不是把中文翻译成英文，而是把课堂里出现的业务场景、顾问动作、学生练习和可交付口语输出整理出来。",
        "",
        "## 课程主线",
        "",
    ]
    if overall_sentences:
        for sentence in overall_sentences:
            lines.append(f"- {sentence}")
    else:
        lines.append("- 本课暂无可提取摘要，请先复核逐字稿质量。")
    lines.extend(["", "## 高频英文/SAP表达", ""])
    if terms:
        for term in terms:
            lines.append(f"- `{term}`")
    else:
        lines.append("- 暂未自动抽取到稳定英文术语。")
    lines.extend(["", "## 讲师总览", ""])
    for name, notes in overall_categories:
        lines.append(f"### {name}")
        lines.append("")
        for note in notes:
            lines.append(f"- {note}")
        lines.append("")
    lines.extend(["## 画面/OCR线索", ""])
    if ocr_items:
        lines.append("以下来自视频画面抽帧 OCR，用于补充课件/屏幕上出现过的文字。OCR 会有误识别，正式引用前需要回看原视频。")
        lines.append("")
        for item in ocr_items[:20]:
            text = md_escape(item["text"])
            lines.append(f"- `{hms(item['time_seconds'])}` {text[:240]}")
    else:
        lines.append("- 暂未生成画面 OCR；本版主要基于音频逐字稿。")
    lines.append("")
    lines.extend(["## 时间线教程", ""])
    for block in blocks:
        block_text = block["text"]
        block_terms = english_terms(block_text, 10)
        block_categories = categories_for(block_text)
        summary = representative_sentences(block_text, 4)
        practices = practice_lines(block["segments"], 5)
        ocr_in_block = [
            item
            for item in ocr_items
            if float(block["start"]) <= float(item.get("time_seconds", 0)) < float(block["end"])
        ]
        lines.append(f"### {hms(block['start'])} - {hms(block['end'])}")
        lines.append("")
        lines.append("**老师讲的知识点**")
        lines.append("")
        if summary:
            for item in summary:
                lines.append(f"- {item}")
        else:
            lines.append("- 这一时间段语音内容较少或需要人工复核。")
        lines.append("")
        lines.append("**学生练习了什么**")
        lines.append("")
        if practices:
            for item in practices:
                lines.append(f"- {item}")
        else:
            lines.append("- 自动转录中没有明显识别到学生练习指令；讲师复盘时可回看该时间段确认互动细节。")
        lines.append("")
        lines.append("**Input**")
        lines.append("")
        if block_terms:
            lines.append("- 语言输入：" + " / ".join(f"`{term}`" for term in block_terms[:8]))
        else:
            lines.append("- 语言输入：以本段逐字稿中的中文业务说明和课堂问答为主。")
        cat_names = [name for name, _ in block_categories]
        lines.append("- 场景输入：" + "、".join(cat_names))
        if ocr_in_block:
            ocr_text = " / ".join(item["text"][:80] for item in ocr_in_block[:3])
            lines.append("- 画面输入：" + md_escape(ocr_text))
        lines.append("")
        lines.append("**Output**")
        lines.append("")
        lines.append("- 学生应能用英文说出本段场景中的顾问动作、系统对象、业务目的和下一步确认。")
        if block_terms:
            lines.append("- 建议输出形式：用 2-3 句英文，把 `" + "`, `".join(block_terms[:4]) + "` 串成一个真实项目表达。")
        lines.append("")
        lines.append("**讲师需要讲解和总结**")
        lines.append("")
        for _, notes in block_categories:
            for note in notes:
                lines.append(f"- {note}")
        lines.append("- 复盘时请补充：本段英文表达是否能直接用于项目会议；如果不能，应改写成更自然的顾问口语。")
        lines.append("")
        lines.append("**逐字稿摘录**")
        lines.append("")
        excerpt = " ".join(s.get("text", "").strip() for s in block["segments"][:3])
        lines.append("> " + md_escape(excerpt[:500] + ("..." if len(excerpt) > 500 else "")))
        lines.append("")
    lines.extend(
        [
            "## 讲师复盘清单",
            "",
            "- 是否把 SAP 场景讲清楚：背景、系统对象、业务动作、预期结果。",
            "- 是否把中文解释转成了学生能开口说的英文句型。",
            "- 是否区分了 input、system action、output，而不是只背单词。",
            "- 是否让学生练过真实顾问互动：提问、澄清、复述、确认下一步。",
            "- 是否标记了需要人工复核的术语、姓名、低音量互动。",
            "",
            "## 需要人工复核",
            "",
            "- Whisper 没有人声分离，老师和学生抢话时可能合并在同一段。",
            "- SAP 事务码、模块名、英文短语可能被误写，需要对照视频或课堂资料校正。",
            "- 本教程是机器逐字稿上的结构化初稿，适合作为讲师二次打磨底稿。",
        ]
    )
    return "\n".join(lines).rstrip() + "\n"


def write_outputs(video: Path, slug: str, meta: dict) -> dict[str, str | int]:
    json_path = RAW_DIR / f"{slug}.json"
    transcript = load_json(json_path)
    transcript_md = MD_DIR / f"{slug}_逐字稿.md"
    guide_md = GUIDE_DIR / f"{slug}_时间线培训教程.md"
    transcript_md.write_text(make_transcript_md(video, slug, meta, transcript), encoding="utf-8")
    guide_md.write_text(make_guide_md(video, slug, meta, transcript), encoding="utf-8")
    segments = transcript.get("segments", [])
    return {
        "slug": slug,
        "source_file": str(video.relative_to(ROOT)),
        "duration_seconds": int(float(meta["duration"])),
        "segment_count": len(segments),
        "transcript_json": str(json_path.relative_to(ROOT)),
        "transcript_md": str(transcript_md.relative_to(ROOT)),
        "course_guide": str(guide_md.relative_to(ROOT)),
        "visual_ocr_json": str((OCR_DIR / f"{slug}.json").relative_to(ROOT))
        if (OCR_DIR / f"{slug}.json").exists()
        else "",
    }


def load_ocr(slug: str) -> list[dict]:
    path = OCR_DIR / f"{slug}.json"
    if not path.exists():
        return []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []
    return data.get("items", [])


def clean_ocr_text(text: str) -> str:
    lines = []
    for line in text.splitlines():
        line = re.sub(r"\s+", " ", line).strip()
        if len(line) >= 4:
            lines.append(line)
    joined = " ".join(lines)
    joined = re.sub(r"\s+", " ", joined)
    return joined.strip()


def build_visual_ocr(video: Path, slug: str, interval_seconds: int, force: bool = False) -> None:
    ocr_json = OCR_DIR / f"{slug}.json"
    if ocr_json.exists() and not force:
        print(f"skip existing visual OCR: {ocr_json.relative_to(ROOT)}", flush=True)
        return
    frame_dir = OCR_DIR / f"{slug}_frames"
    frame_dir.mkdir(parents=True, exist_ok=True)
    for old in frame_dir.glob("frame_*.jpg"):
        old.unlink()
    vf = f"fps=1/{interval_seconds},scale=1280:-1"
    cmd = [
        "ffmpeg",
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-i",
        str(video),
        "-vf",
        vf,
        str(frame_dir / "frame_%05d.jpg"),
    ]
    run(cmd)
    items = []
    frames = sorted(frame_dir.glob("frame_*.jpg"))
    for idx, frame in enumerate(frames):
        time_seconds = idx * interval_seconds
        proc = subprocess.run(
            ["tesseract", str(frame), "stdout", "-l", "chi_sim+eng", "--psm", "6"],
            text=True,
            cwd=ROOT,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            check=False,
        )
        text = clean_ocr_text(proc.stdout)
        if len(text) >= 8:
            items.append(
                {
                    "time_seconds": time_seconds,
                    "time": hms(time_seconds),
                    "frame": str(frame.relative_to(ROOT)),
                    "text": text,
                }
            )
    ocr_json.write_text(
        json.dumps(
            {
                "source_file": str(video.relative_to(ROOT)),
                "interval_seconds": interval_seconds,
                "review_state": "ocr_needs_human_review",
                "items": items,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )


def build_index(items: list[dict]) -> None:
    now = dt.datetime.now().astimezone().isoformat(timespec="seconds")
    total_seconds = sum(int(item["duration_seconds"]) for item in items)
    index = [
        "# 大胆说英语H班 SAP顾问英语培训 转录与教程索引",
        "",
        f"- generated_at: `{now}`",
        f"- video_count: `{len(items)}`",
        f"- total_duration: `{hms(total_seconds)}`",
        "- language_policy: 中文和英文保留原样；不翻译成日文。",
        "- review_state: `machine_transcript_needs_human_review`",
        "",
        "## 文件清单",
        "",
        "| # | 视频 | 时长 | 段落数 | 逐字稿 | 时间线教程 | 画面OCR |",
        "|---:|---|---:|---:|---|---|---|",
    ]
    for idx, item in enumerate(items, start=1):
        index.append(
            "| {idx} | `{video}` | `{duration}` | {segments} | `{transcript}` | `{guide}` | `{ocr}` |".format(
                idx=idx,
                video=md_escape(item["source_file"]),
                duration=hms(int(item["duration_seconds"])),
                segments=item["segment_count"],
                transcript=md_escape(item["transcript_md"]),
                guide=md_escape(item["course_guide"]),
                ocr=md_escape(item.get("visual_ocr_json", "")),
            )
        )
    index.extend(
        [
            "",
            "## 使用建议",
            "",
            "- 先读每节课的 `时间线培训教程.md`，再按时间戳回到 `逐字稿.md` 精修。",
            "- 每次正式复用前，建议人工复核 SAP 术语、英文句型、学生回答和低音量片段。",
            "- 如果要做讲师版课件，可把每个时间段的 Input/Output 拆成课堂练习页。",
        ]
    )
    (OUT / "00_INDEX.md").write_text("\n".join(index) + "\n", encoding="utf-8")
    (REPORT_DIR / "manifest.json").write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-transcribe", action="store_true", help="Only build Markdown from existing JSON.")
    parser.add_argument("--force", action="store_true", help="Re-run transcription even if JSON exists.")
    parser.add_argument("--limit", type=int, default=0, help="Process only the first N videos.")
    parser.add_argument("--with-ocr", action="store_true", help="Extract screen-frame OCR before rebuilding guides.")
    parser.add_argument("--ocr-interval", type=int, default=600, help="Seconds between OCR frames.")
    args = parser.parse_args()

    ensure_dirs()
    videos = find_videos()
    if args.limit:
        videos = videos[: args.limit]
    seen: collections.Counter[str] = collections.Counter()
    items = []
    for index, video in enumerate(videos, start=1):
        slug = lesson_slug(video, seen)
        meta = ffprobe(video)
        print(f"\n== [{index}/{len(videos)}] {video.relative_to(ROOT)} ({hms(meta['duration'])}) ==", flush=True)
        if not args.skip_transcribe:
            transcribe(video, slug, force=args.force)
        if args.with_ocr:
            build_visual_ocr(video, slug, interval_seconds=args.ocr_interval, force=args.force)
        if not (RAW_DIR / f"{slug}.json").exists():
            print(f"missing transcript json for {slug}", file=sys.stderr)
            continue
        items.append(write_outputs(video, slug, meta))
        build_index(items)
    build_index(items)
    print(f"\nDone. Index: {(OUT / '00_INDEX.md').relative_to(ROOT)}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
