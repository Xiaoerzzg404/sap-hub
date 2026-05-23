from __future__ import annotations

import csv
import datetime as dt
import re
from collections import Counter, defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

MODULES = [
    {"name": "SAP项目", "key": "sap_project", "max": 25},
    {"name": "SAP AI", "key": "sap_ai", "max": 20},
    {"name": "知识库", "key": "knowledge", "max": 15},
    {"name": "自媒体", "key": "self_media", "max": 15},
    {"name": "口播训练", "key": "speaking", "max": 10},
    {"name": "第二人生", "key": "second_life", "max": 5},
    {"name": "身体家庭", "key": "health_family", "max": 10},
]

CSV_HEADER = [
    "date",
    "total_score",
    "sap_project",
    "sap_ai",
    "knowledge",
    "self_media",
    "speaking",
    "second_life",
    "health_family",
    "hard_cap_note",
]

TARGET_LABELS = {
    "average_score": "月平均分",
    "sap_ai_days": "SAP AI 学习天数",
    "knowledge_cards": "知识卡片数",
    "videos": "视频/自媒体产出数",
    "speaking_practice": "口播训练次数",
    "course_files": "课程文件数",
    "family_activities": "家庭活动次数",
    "exercise_times": "运动次数",
    "second_life_research": "第二人生研究次数",
    "late_night_max": "1点后熬夜次数上限",
}


def today_iso() -> str:
    return dt.date.today().isoformat()


def parse_date(value: str | None) -> dt.date:
    return dt.date.fromisoformat(value) if value else dt.date.today()


def format_number(value: float | int) -> str:
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return f"{value:.2f}".rstrip("0").rstrip(".")


def normalize_label(value: str) -> str:
    return re.sub(r"[\s_\-：:]+", "", value).lower()


def clean_yaml_value(value: str) -> str | int | float:
    value = value.strip().strip('"').strip("'")
    if re.fullmatch(r"-?\d+", value):
        return int(value)
    if re.fullmatch(r"-?\d+\.\d+", value):
        return float(value)
    return value


def load_scoring_rules() -> dict:
    path = ROOT / "config" / "scoring_rules.yaml"
    result = {"daily_score": {}, "hard_caps": [], "monthly_targets": {}}
    section = None
    current_cap = None

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        if not raw_line.strip() or raw_line.strip().startswith("#"):
            continue

        if not raw_line.startswith(" "):
            key = raw_line.split(":", 1)[0].strip()
            section = key if key in result else None
            continue

        stripped = raw_line.strip()
        if section in {"daily_score", "monthly_targets"} and ":" in stripped:
            key, value = stripped.split(":", 1)
            result[section][key.strip()] = clean_yaml_value(value)
            continue

        if section == "hard_caps":
            if stripped.startswith("- "):
                if current_cap:
                    result["hard_caps"].append(current_cap)
                current_cap = {}
                stripped = stripped[2:].strip()

            if current_cap is not None and ":" in stripped:
                key, value = stripped.split(":", 1)
                current_cap[key.strip()] = clean_yaml_value(value)

    if current_cap:
        result["hard_caps"].append(current_cap)

    return result


def parse_score_cell(value: str) -> float:
    value = value.strip()
    if not value or value.startswith("/"):
        return 0.0
    match = re.search(r"(-?\d+(?:\.\d+)?)\s*(?:/|$)", value)
    return float(match.group(1)) if match else 0.0


def extract_section(text: str, title: str) -> str:
    pattern = re.compile(rf"^##\s+\d+\.\s+{re.escape(title)}\s*$", re.MULTILINE)
    match = pattern.search(text)
    if not match:
        return ""
    start = match.end()
    next_match = re.search(r"^##\s+", text[start:], re.MULTILINE)
    end = start + next_match.start() if next_match else len(text)
    return text[start:end].strip()


def extract_subsection(text: str, title: str) -> str:
    pattern = re.compile(rf"^###\s+{re.escape(title)}\s*$", re.MULTILINE)
    match = pattern.search(text)
    if not match:
        return ""
    start = match.end()
    next_match = re.search(r"^(?:###|##)\s+", text[start:], re.MULTILINE)
    end = start + next_match.start() if next_match else len(text)
    return text[start:end].strip()


def meaningful_lines(section_text: str) -> list[str]:
    lines = []
    for raw_line in section_text.splitlines():
        line = raw_line.strip()
        if line.startswith("-"):
            line = line[1:].strip()
        if not line or line == "-":
            continue
        lines.append(line)
    return lines


def section_has_text(section_text: str) -> bool:
    return bool(meaningful_lines(section_text))


def extract_bullets(text: str, title: str) -> list[str]:
    return meaningful_lines(extract_section(text, title))


def checked_hard_cap_labels(text: str) -> list[str]:
    labels = []
    for match in re.finditer(r"^-\s*\[[xX]\]\s*(.+?)\s*$", text, re.MULTILINE):
        labels.append(match.group(1).strip())
    return labels


def parse_daily_log(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    scores = {module["key"]: 0.0 for module in MODULES}

    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line.startswith("|") or "---" in line:
            continue
        cells = [cell.strip() for cell in line.strip("|").split("|")]
        if len(cells) < 2:
            continue
        label = normalize_label(cells[0])
        for module in MODULES:
            if label == normalize_label(module["name"]):
                scores[module["key"]] = parse_score_cell(cells[1])

    raw_total = sum(scores.values())
    rules = load_scoring_rules()
    checked_labels = checked_hard_cap_labels(text)
    checked_caps = []
    for label in checked_labels:
        normalized_label = normalize_label(label)
        for cap in rules["hard_caps"]:
            condition = str(cap.get("condition", ""))
            if normalized_label == normalize_label(condition):
                checked_caps.append(cap)
                break

    hard_cap_note = ""
    total_score = raw_total
    if checked_caps:
        cap_limit = min(float(cap.get("max_score", raw_total)) for cap in checked_caps)
        conditions = "；".join(str(cap.get("condition", "")) for cap in checked_caps)
        if raw_total > cap_limit:
            total_score = cap_limit
            hard_cap_note = (
                f"触发硬上限: {conditions}；原始分 {format_number(raw_total)}，"
                f"按上限 {format_number(cap_limit)} 记录"
            )
        else:
            hard_cap_note = (
                f"触发硬上限: {conditions}；当前分 {format_number(raw_total)} "
                f"未超过上限 {format_number(cap_limit)}"
            )

    return {
        "date": path.stem,
        "path": path,
        "text": text,
        "scores": scores,
        "raw_total": raw_total,
        "total_score": total_score,
        "hard_cap_note": hard_cap_note,
        "checked_hard_caps": checked_labels,
        "wins": extract_bullets(text, "今日最小胜利"),
        "blockers": extract_bullets(text, "今日最大阻碍"),
        "sections": {
            "SAP项目": extract_subsection(text, "SAP项目"),
            "SAP AI": extract_subsection(text, "SAP AI"),
            "知识库": extract_subsection(text, "知识库"),
            "自媒体": extract_subsection(text, "自媒体"),
            "课程": extract_subsection(text, "课程"),
            "第二人生": extract_subsection(text, "第二人生"),
            "家庭与身体": extract_subsection(text, "家庭与身体"),
        },
    }


def daily_log_path(date_text: str) -> Path:
    return ROOT / "logs" / "daily" / f"{date_text}.md"


def daily_logs_between(end_date: dt.date, days: int = 7) -> list[Path]:
    start_date = end_date - dt.timedelta(days=days - 1)
    paths = []
    for path in sorted((ROOT / "logs" / "daily").glob("*.md")):
        try:
            file_date = dt.date.fromisoformat(path.stem)
        except ValueError:
            continue
        if start_date <= file_date <= end_date:
            paths.append(path)
    return paths


def daily_logs_for_month(month: str) -> list[Path]:
    return sorted((ROOT / "logs" / "daily").glob(f"{month}-*.md"))


def average(values: list[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def module_averages(parsed_logs: list[dict]) -> dict[str, float]:
    result = {}
    for module in MODULES:
        key = module["key"]
        result[key] = average([parsed["scores"][key] for parsed in parsed_logs])
    return result


def score_trend_path() -> Path:
    return ROOT / "dashboard" / "score_trend.csv"


def ensure_score_csv() -> None:
    path = score_trend_path()
    if not path.exists() or not path.read_text(encoding="utf-8").strip():
        path.write_text(",".join(CSV_HEADER) + "\n", encoding="utf-8")


def append_score_row(parsed: dict) -> None:
    ensure_score_csv()
    row = {
        "date": parsed["date"],
        "total_score": format_number(parsed["total_score"]),
        "hard_cap_note": parsed["hard_cap_note"],
    }
    for module in MODULES:
        row[module["key"]] = format_number(parsed["scores"][module["key"]])

    with score_trend_path().open("a", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=CSV_HEADER)
        writer.writerow(row)


def read_score_rows() -> list[dict]:
    path = score_trend_path()
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def latest_score_rows_by_date() -> list[dict]:
    latest = {}
    for row in read_score_rows():
        if row.get("date"):
            latest[row["date"]] = row
    return [latest[date] for date in sorted(latest)]


def parse_metric_markers(text: str) -> dict[str, float]:
    markers = defaultdict(float)
    for key, value in re.findall(r"\[metric:([a-zA-Z0-9_]+)\s*=\s*(-?\d+(?:\.\d+)?)\]", text):
        markers[key] += float(value)
    return dict(markers)


def count_keyword_lines(section_text: str, keywords: list[str]) -> int:
    count = 0
    for line in meaningful_lines(section_text):
        if any(keyword.lower() in line.lower() for keyword in keywords):
            count += 1
    return count


def daily_metrics(parsed: dict) -> dict[str, float]:
    text = parsed["text"]
    markers = parse_metric_markers(text)
    sections = parsed["sections"]
    checked = [normalize_label(label) for label in parsed["checked_hard_caps"]]

    def marker_or_fallback(key: str, fallback: float) -> float:
        return markers[key] if key in markers else fallback

    metrics = {
        "sap_ai_days": marker_or_fallback(
            "sap_ai_days",
            1.0 if parsed["scores"]["sap_ai"] > 0 or section_has_text(sections["SAP AI"]) else 0.0,
        ),
        "knowledge_cards": marker_or_fallback(
            "knowledge_cards",
            float(count_keyword_lines(sections["知识库"], ["知识卡", "卡片", "card"])),
        ),
        "videos": marker_or_fallback(
            "videos",
            float(count_keyword_lines(sections["自媒体"], ["视频", "发布", "剪辑", "脚本", "小红书", "公众号"])),
        ),
        "speaking_practice": marker_or_fallback(
            "speaking_practice",
            1.0 if parsed["scores"]["speaking"] > 0 or count_keyword_lines(text, ["口播", "朗读", "录音"]) else 0.0,
        ),
        "course_files": marker_or_fallback(
            "course_files",
            float(count_keyword_lines(sections["课程"], ["文件", ".md", "讲义", "课件", "课程"])),
        ),
        "family_activities": marker_or_fallback(
            "family_activities",
            float(count_keyword_lines(sections["家庭与身体"], ["陪", "孩子", "家庭", "亲子", "家人"])),
        ),
        "exercise_times": marker_or_fallback(
            "exercise_times",
            float(count_keyword_lines(sections["家庭与身体"], ["运动", "跑步", "健身", "散步", "训练", "走路"])),
        ),
        "second_life_research": marker_or_fallback(
            "second_life_research",
            1.0 if section_has_text(sections["第二人生"]) else 0.0,
        ),
        "late_night_max": 1.0 if normalize_label("熬夜到1点以后") in checked else 0.0,
    }
    return metrics


def monthly_actuals(month: str) -> dict:
    parsed_logs = [parse_daily_log(path) for path in daily_logs_for_month(month)]
    actuals = defaultdict(float)
    for parsed in parsed_logs:
        for key, value in daily_metrics(parsed).items():
            actuals[key] += value

    actuals["average_score"] = average([parsed["total_score"] for parsed in parsed_logs])
    return {"parsed_logs": parsed_logs, "actuals": dict(actuals)}


def target_status(key: str, actual: float, target: float) -> str:
    if key == "late_night_max":
        if actual <= target:
            return "GREEN"
        if actual <= target + 2:
            return "YELLOW"
        return "RED"

    if target <= 0:
        return "GREEN" if actual <= 0 else "RED"

    ratio = actual / target
    if ratio >= 1:
        return "GREEN"
    if ratio >= 0.8:
        return "YELLOW"
    return "RED"


def monthly_target_rows(month: str) -> list[dict]:
    rules = load_scoring_rules()
    data = monthly_actuals(month)
    actuals = data["actuals"]
    rows = []
    for key, target in rules["monthly_targets"].items():
        actual = float(actuals.get(key, 0.0))
        target_value = float(target)
        rows.append(
            {
                "key": key,
                "label": TARGET_LABELS.get(key, key),
                "actual": actual,
                "target": target_value,
                "status": target_status(key, actual, target_value),
            }
        )
    return rows


def top_items(items: list[str], limit: int = 3) -> list[str]:
    cleaned = [item for item in items if item and item != "-"]
    if not cleaned:
        return []
    counts = Counter(cleaned)
    return [item for item, _ in counts.most_common(limit)]


def write_dashboard_file(name: str, content: str) -> Path:
    path = ROOT / "dashboard" / name
    path.write_text(content.rstrip() + "\n", encoding="utf-8")
    return path

