"""SAPKB ingest 采集（Run01 fixture + Run02 真实 RSS/RSSHub）。

机械职责：读源配置 → 取元数据线索 → 标准化 → **持久化前丢弃全文 body**。
合规关键（docs/05 v3）：RSS/RSSHub 的 summary/content 常含整篇正文 HTML，
本模块在产出前【剥 HTML + 截断为安全摘要】，绝不把整篇正文当 summary 落库。
入库/去重/标签不在这里（归 pipeline / Lead 模块）。
"""
from __future__ import annotations

import argparse
import html
import json
import pathlib
import re
import urllib.request
from typing import Any, Dict, Generator, Optional

import yaml

REPO_ROOT = pathlib.Path(__file__).resolve().parents[3]
DEFAULT_CONFIG_PATH = REPO_ROOT / "configs" / "sapkb" / "acquisition_sources.yaml"
DEFAULT_FIXTURES_DIR = pathlib.Path(__file__).resolve().parents[1] / "tests" / "fixtures"

# 摘要安全长度：RSS 常把整篇正文塞进 summary，这里只留前 N 字做元数据摘要，绝不存全文。
SUMMARY_MAX_CHARS = 280
_TAG_RE = re.compile(r"<[^>]+>")
_WS_RE = re.compile(r"\s+")
_USER_AGENT = "OpenClawSAPKB/0.2 (metadata-only; +sap-hub)"


def _load_sources_config(config_path: Optional[str] = None) -> Dict[str, Any]:
    path = pathlib.Path(config_path) if config_path else DEFAULT_CONFIG_PATH
    with path.open("r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
    if not isinstance(data, dict):
        raise TypeError("acquisition_sources.yaml must contain a top-level mapping")
    return data


def _find_source_meta(config: Dict[str, Any], source_id: str) -> Dict[str, Any]:
    for source in config.get("sources", []):
        if isinstance(source, dict) and source.get("id") == source_id:
            return source
    return {}


def _strip_to_summary(raw_text: Optional[str]) -> str:
    """剥 HTML 标签 + 反转义 + 合并空白 + 截断——把可能的整篇正文降级为安全摘要。"""
    if not raw_text:
        return ""
    text = _TAG_RE.sub(" ", str(raw_text))
    text = html.unescape(text)
    text = _WS_RE.sub(" ", text).strip()
    if len(text) > SUMMARY_MAX_CHARS:
        text = text[:SUMMARY_MAX_CHARS].rstrip() + "…"
    return text


# ---------------- fixture 路径（Run01） ----------------

def _iter_fixture_records(fixtures_dir: str, filename: str = "csdn_sample.jsonl") -> Generator[Dict[str, Any], None, None]:
    fixture_file = pathlib.Path(fixtures_dir) / filename
    with fixture_file.open("r", encoding="utf-8") as f:
        for line_no, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue
            try:
                record = json.loads(line)
            except json.JSONDecodeError as exc:
                raise ValueError("Invalid JSON in {}: line {}".format(fixture_file, line_no)) from exc
            if not isinstance(record, dict):
                raise TypeError("Invalid fixture record at {}:{}".format(fixture_file, line_no))
            yield record


def _normalize_fixture(raw: Dict[str, Any], import_mode: str) -> Dict[str, Any]:
    for key in ("body", "content", "text", "raw_text"):
        raw.pop(key, None)
    platform = raw.get("source_platform") or raw.get("platform") or "CSDN"
    rec = {
        "source_platform": platform,
        "source_url": raw.get("source_url"),
        "title": raw.get("title"),
        "author": raw.get("author"),
        "author_uid": raw.get("author_uid"),
        "published_at": raw.get("published_at"),
        "summary": _strip_to_summary(raw.get("summary")),
        "import_mode": import_mode or "metadata_only",
    }
    # 专栏关系（需求8）：若记录带 columns[{name,seq,source_url}] 则透传给 pipeline 建 column_items。
    if isinstance(raw.get("columns"), list) and raw["columns"]:
        rec["columns"] = raw["columns"]
    return rec


# ---------------- 真实 RSS / RSSHub 路径（Run02） ----------------

def _fetch(url: str, timeout: int = 20) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": _USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as resp:  # nosec - 公开 RSS，仅 GET，不带凭据
        return resp.read()


def harvest_rss(feed_url: str, source_platform: str, import_mode: str = "metadata_only",
                timeout: int = 20) -> Generator[Dict[str, Any], None, None]:
    """抓一个公开 RSS/Atom 源，产出 metadata-only 记录（剥正文、截摘要）。

    只做 GET、不带 cookie/凭据、不登录；summary 经 _strip_to_summary 降级，绝不落全文。
    """
    import feedparser  # 延迟导入，fixture 路径不依赖

    parsed = feedparser.parse(_fetch(feed_url, timeout))
    for e in parsed.entries:
        # 丢弃任何整篇正文字段，只保留链接+剥离后的短摘要
        summary_src = e.get("summary") or e.get("description") or ""
        yield {
            "source_platform": source_platform,
            "source_url": e.get("link"),
            "title": (e.get("title") or "").strip(),
            "author": e.get("author"),
            "author_uid": e.get("author"),
            "published_at": e.get("published") or e.get("updated"),
            "summary": _strip_to_summary(summary_src),
            "import_mode": import_mode or "metadata_only",
        }


def harvest_csdn_api(username: str, author_name: str, import_mode: str = "metadata_only",
                     max_pages: int = 3, page_size: int = 40,
                     interval_sec: float = 1.0) -> Generator[Dict[str, Any], None, None]:
    """抓 CSDN 某作者的【公开文章列表】JSON API（GET、无登录、无 cookie、仅元数据）。

    用 CSDN 自家前端在用的 community/home-api business-list 公开端点，仅取标题/链接/日期/摘要，
    绝不取全文、不登录、不绕风控；与 RSSHub 的 csdn 路由同源。低频分页、礼貌限速。
    """
    import time as _time

    base = ("https://blog.csdn.net/community/home-api/v1/get-business-list"
            "?businessType=blog&orderby=&noMore=false")
    seen_urls = set()
    for page in range(1, max_pages + 1):
        url = "{}&page={}&size={}&username={}".format(base, page, page_size, username)
        try:
            req = urllib.request.Request(url, headers={
                "User-Agent": _USER_AGENT, "Accept": "application/json",
                "Referer": "https://blog.csdn.net/"})
            with urllib.request.urlopen(req, timeout=20) as resp:  # nosec - 公开API，GET，无凭据
                data = json.loads(resp.read().decode("utf-8", "ignore"))
        except Exception:
            break
        items = ((data.get("data") or {}).get("list")) or []
        if not items:
            break
        for it in items:
            u = it.get("url")
            if not u or u in seen_urls:
                continue
            seen_urls.add(u)
            yield {
                "source_platform": "CSDN",
                "source_url": u,
                "title": (it.get("title") or "").strip(),
                "author": author_name,
                "author_uid": username,
                "published_at": it.get("postTime") or it.get("formatTime"),
                "summary": _strip_to_summary(it.get("description")),
                "import_mode": import_mode or "metadata_only",
            }
        if len(items) < page_size:
            break
        _time.sleep(interval_sec)


def harvest_source(source_id: str, fixtures_dir: str = str(DEFAULT_FIXTURES_DIR),
                   config_path: Optional[str] = None) -> Generator[Dict[str, Any], None, None]:
    """按源 id 产出标准化 metadata 记录。支持 fixture / rss / rsshub。"""
    config = _load_sources_config(config_path)
    meta = _find_source_meta(config, source_id)
    import_mode = meta.get("import_mode", "metadata_only")

    if source_id == "fixture_csdn":
        for item in _iter_fixture_records(fixtures_dir):
            yield _normalize_fixture(item, import_mode)
        return

    if source_id == "fixture_column":
        for item in _iter_fixture_records(fixtures_dir, "csdn_column_series.jsonl"):
            yield _normalize_fixture(item, import_mode or "metadata_only")
        return

    stype = meta.get("type")
    if stype == "csdn_api":
        for rec in harvest_csdn_api(
                meta.get("username"), meta.get("author_name") or meta.get("username") or "",
                import_mode, int(meta.get("max_pages", 3)), int(meta.get("page_size", 40))):
            yield rec
        return

    if stype == "rss":
        feed_url = meta.get("feed_url")
        if not feed_url:
            raise ValueError("source '{}' type=rss 缺 feed_url".format(source_id))
        platform = meta.get("platform", "rss")
        for rec in harvest_rss(feed_url, platform, import_mode):
            yield rec
        return

    if stype == "rsshub":
        base = meta.get("rsshub_base") or config.get("rsshub_base")
        route = meta.get("route")
        if not (base and route):
            raise NotImplementedError(
                "source '{}' 为 rsshub 类型，但未配置可达的 rsshub_base+route"
                "（本机 RSSHub 127.0.0.1:1200 未运行，公共实例 403）。"
                "需 Ryan 启动本地 RSSHub 后在 yaml 配 rsshub_base 再启用。".format(source_id)
            )
        platform = meta.get("platform", "rsshub")
        for rec in harvest_rss(base.rstrip("/") + "/" + route.lstrip("/"), platform, import_mode):
            yield rec
        return

    raise NotImplementedError("source '{}' 暂不支持（type={}）".format(source_id, stype))


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="SAPKB harvest helper")
    parser.add_argument("--source", default="fixture_csdn")
    parser.add_argument("--fixtures-dir", default=str(DEFAULT_FIXTURES_DIR))
    return parser


def main() -> None:
    args = _build_parser().parse_args()
    for record in harvest_source(args.source, args.fixtures_dir):
        print(json.dumps(record, ensure_ascii=False))


if __name__ == "__main__":
    main()
