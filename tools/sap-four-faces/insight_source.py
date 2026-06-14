#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""insight_source · 四面台用 SAP Insight Desk 的 publishStatus 做去重的单一来源。

设计（Ryan 2026-06-14 指示）：
  - 选题只从 Insight Desk feed 取 `publishStatus.<platform>.status == not_published`
    且未被 reuseStatus 阻断的条目（= 已发布的自动带「已发布」标签被排除）。
  - 发布后调 `record_publish.js` 写回 Insight Desk（platform=wechat_official_account /
    wechat_channels，status=draft_created），下次 feed 重建即带标签、不再出现。
  - 本地 consumed.json 作**短期安全网**：feed 重建有延迟/不稳定（articleId 是内容哈希、
    每次重建会变，稳定键是 canonicalUrl），本地集合按 canonicalUrl 兜底，避免同会话/
    传播滞后期内重复选题。Insight Desk 仍是权威，本地集合只保留近 21 天、可随时重建。

用法（库 / CLI）：
  insight_source.py eligible  [--platform wechat_official_account] [--json]
  insight_source.py mark --url <URL> --platform <p> --batch <b> [--id <articleId>]
  insight_source.py mark-from-md <article.md> --platform <p> --batch <b>
"""
from __future__ import annotations
import json, os, re, sys, subprocess, datetime
from typing import Optional, List, Dict, Any

HOME = os.path.expanduser("~")
AA5A = os.path.join(HOME, ".codex/worktrees/aa5a/OpenClaw/sap-news-pipeline")
FEED = os.environ.get("SAP_FF_FEED", os.path.join(AA5A, "insight-desk/data/agent-feed-lite.json"))
RECORD_PUBLISH = os.path.join(AA5A, "scripts/record_publish.js")
TOOL_DIR = os.path.dirname(os.path.abspath(__file__))
CONSUMED = os.path.join(TOOL_DIR, "state", "consumed.json")
NODE = "/opt/homebrew/bin/node"
KEEP_DAYS = 21


def canon(u: str) -> str:
    if not u:
        return ""
    u = u.strip().split("#")[0].split("?")[0].rstrip("/")
    return u.lower()


def load_feed() -> List[Dict[str, Any]]:
    try:
        with open(FEED, encoding="utf-8") as f:
            return (json.load(f) or {}).get("items", [])
    except Exception:
        return []


def _oa(it: Dict[str, Any], platform: str) -> Dict[str, Any]:
    key = "wechatChannels" if platform == "wechat_channels" else "wechatOfficialAccount"
    return (it.get("publishStatus") or {}).get(key, {}) or {}


def _load_consumed() -> Dict[str, Any]:
    try:
        with open(CONSUMED, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def _save_consumed(d: Dict[str, Any]) -> None:
    os.makedirs(os.path.dirname(CONSUMED), exist_ok=True)
    cutoff = (datetime.date.today() - datetime.timedelta(days=KEEP_DAYS)).isoformat()
    d = {k: v for k, v in d.items() if (v.get("date") or "9999") >= cutoff}
    with open(CONSUMED, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=2)


def consumed_urls(platform: Optional[str] = None) -> set:
    out = set()
    for u, v in _load_consumed().items():
        if platform is None or platform in (v.get("platforms") or []):
            out.add(u)
    return out


def eligible(platform: str = "wechat_official_account") -> List[Dict[str, Any]]:
    """Insight Desk 未发布 + 未被 reuse 阻断 + 不在本地 consumed 安全网里的条目。"""
    local = consumed_urls(platform)
    out = []
    for it in load_feed():
        st = _oa(it, platform).get("status") or "not_published"
        reuse = it.get("reuseStatus") or {}
        if st != "not_published":
            continue
        if reuse.get("blocked"):
            continue
        if canon(it.get("canonicalUrl") or it.get("url") or "") in local:
            continue
        out.append({
            "articleId": it.get("articleId") or it.get("id") or "",
            "url": it.get("url") or "",
            "canonicalUrl": canon(it.get("canonicalUrl") or it.get("url") or ""),
            "title": it.get("title") or "",
            "region": it.get("region") or "",
            "publishedAt": it.get("publishedAt") or "",
        })
    return out


def _article_id_for_url(url: str) -> str:
    cu = canon(url)
    for it in load_feed():
        if canon(it.get("canonicalUrl") or it.get("url") or "") == cu:
            return it.get("articleId") or it.get("id") or ""
    return ""


def mark_published(url: str, platform: str, batch: str,
                   article_id: str = "", dry_run: bool = False) -> bool:
    """写回 Insight Desk（record_publish.js）+ 记本地 consumed 安全网。"""
    aid = article_id or _article_id_for_url(url)
    ok = True
    if aid and os.path.exists(RECORD_PUBLISH):
        cmd = [NODE, RECORD_PUBLISH, "--id", aid, "--status", "draft_created",
               "--platform", platform, "--batchId", batch, "--url", url]
        if dry_run:
            cmd.append("--dryRun")
        try:
            env = dict(os.environ, PATH="/opt/homebrew/bin:/usr/local/bin:" + os.environ.get("PATH", ""))
            r = subprocess.run(cmd, cwd=AA5A, capture_output=True, text=True, env=env)
            ok = r.returncode == 0
        except Exception:
            ok = False
    if not dry_run:
        d = _load_consumed()
        cu = canon(url)
        ent = d.get(cu) or {"date": datetime.date.today().isoformat(), "platforms": []}
        if platform not in ent["platforms"]:
            ent["platforms"].append(platform)
        ent["articleId"] = aid
        d[cu] = ent
        _save_consumed(d)
    return ok


def mark_from_md(md_path: str, platform: str, batch: str, dry_run: bool = False) -> int:
    try:
        text = open(md_path, encoding="utf-8").read()
    except Exception:
        return 0
    urls = sorted(set(re.findall(r"https://news\.sap\.com[^ )\"\n]+", text)))
    n = 0
    for u in urls:
        if mark_published(u, platform, batch, dry_run=dry_run):
            n += 1
    return n


def main(argv=None):
    argv = argv or sys.argv[1:]
    if not argv:
        print(__doc__)
        return 0
    cmd = argv[0]

    def opt(name, default=""):
        return argv[argv.index(name) + 1] if name in argv else default

    if cmd == "eligible":
        plat = opt("--platform", "wechat_official_account")
        items = eligible(plat)
        if "--json" in argv:
            print(json.dumps(items, ensure_ascii=False, indent=2))
        else:
            print("eligible (%s, not_published, reuse-ok): %d" % (plat, len(items)))
            for it in items:
                print("  -", (it["title"] or it["url"])[:60], "|", it["region"], "|", it["publishedAt"])
        return 0
    if cmd == "mark":
        ok = mark_published(opt("--url"), opt("--platform", "wechat_official_account"),
                            opt("--batch", "four-faces"), opt("--id"), "--dry-run" in argv)
        print("marked" if ok else "mark-FAILED", opt("--url"))
        return 0 if ok else 1
    if cmd == "mark-from-md":
        n = mark_from_md(argv[1], opt("--platform", "wechat_official_account"),
                         opt("--batch", "four-faces"), "--dry-run" in argv)
        print("marked %d urls from %s" % (n, argv[1]))
        return 0
    print("unknown cmd:", cmd)
    return 2


if __name__ == "__main__":
    sys.exit(main())
