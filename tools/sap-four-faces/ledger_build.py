#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""四面台 ledger builder · 把每天四面流水线的状态/内容/成败/失败原因汇总成 ledger.json。

来源优先级：
  1) PIPE/working/{date}/four_faces_state.json （工具驱动时的权威状态，未来主用）
  2) 从稳定产物重建（历史/工具接管前）：
     face1: STUDIO/data/drafts/{date}/wechat-article.md + .published
     face2: working/{date}/hotnews_channels_live_confirmation_part*.json
     face3: STUDIO/data/per-article/{date}/article_*/ + automation_summary
     face4: working/{date}/shorts/*/channels_draft_upload_evidence.json + deep_shorts_status.json

用法: ledger_build.py [--window N] [--out PATH]
"""
from __future__ import annotations
import json, os, re, glob, sys, datetime
from typing import Optional, List, Dict, Any

HOME = os.path.expanduser("~")
STUDIO = os.environ.get("SAP_FF_STUDIO", os.path.join(HOME, "news/studio"))
PIPE = os.environ.get("SAP_FF_PIPE", os.path.join(HOME, "Documents/OpenClaw/sap-news-pipeline"))


def _load(p: str) -> Optional[Any]:
    try:
        with open(p, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


def _latest_summary(wdir: str) -> Optional[Dict[str, Any]]:
    files = sorted(glob.glob(os.path.join(wdir, "automation_summary_*.json")))
    for p in reversed(files):
        d = _load(p)
        if isinstance(d, dict):
            d["_file"] = os.path.basename(p)
            return d
    return None


def _count_items(md_path: str) -> int:
    try:
        with open(md_path, encoding="utf-8") as f:
            return len(re.findall(r"^### \d{2} · ", f.read(), re.M))
    except Exception:
        return 0


def build_face1(date: str, wdir: str, summ: Optional[Dict]) -> Dict[str, Any]:
    md = os.path.join(STUDIO, "data/drafts", date, "wechat-article.md")
    published = os.path.exists(os.path.join(STUDIO, "data/drafts", date, ".published"))
    rec: Dict[str, Any] = {"status": "pending", "mediaId": None, "items": 0, "content": None}
    if os.path.exists(md):
        rec["items"] = _count_items(md)
        rec["content"] = "drafts/%s/wechat-article.md" % date
    if summ:
        f1 = summ.get("face1_main_official_account") or summ.get("face1") or {}
        if isinstance(f1, dict):
            rec["mediaId"] = f1.get("mediaId") or rec["mediaId"]
            if f1.get("distribution"):
                rec["distribution"] = f1["distribution"]
    if rec["mediaId"] or published:
        rec["status"] = "done"
    elif rec["content"]:
        rec["status"] = "content_ready"
    rec["published"] = published
    return rec


def build_face2(date: str, wdir: str) -> Dict[str, Any]:
    confs = sorted(glob.glob(os.path.join(wdir, "hotnews_channels_live_confirmation_part*.json")))
    obj, titles = [], []
    for c in confs:
        d = _load(c) or {}
        oid = (d.get("saveApi") or {}).get("objectId") or d.get("objectId")
        if oid:
            obj.append(oid)
        if d.get("title"):
            titles.append(d["title"])
    rec = {"status": "pending", "objectIds": obj, "count": len(obj), "titles": titles}
    if obj:
        rec["status"] = "done"
    return rec


def build_face3(date: str, summ: Optional[Dict]) -> Dict[str, Any]:
    base = os.path.join(STUDIO, "data/per-article", date)
    arts = []
    for d in sorted(glob.glob(os.path.join(base, "article_*_v1"))):
        c = _load(os.path.join(d, "content.json")) or {}
        arts.append({"slug": os.path.basename(d), "title": c.get("title", ""), "hasCover": os.path.exists(os.path.join(d, "cover.jpg"))})
    rec: Dict[str, Any] = {"status": "pending", "articles": arts, "count": len(arts), "warnings": []}
    if summ:
        f3 = summ.get("face3_deep_official_account") or summ.get("face3") or {}
        if isinstance(f3, dict):
            mids = f3.get("mediaIds") or {}
            if isinstance(mids, dict):
                for a in arts:
                    for k, v in mids.items():
                        if a["slug"].split("_")[1] in k or k.endswith(a["slug"]):
                            a["mediaId"] = v
            if f3.get("WARNING"):
                rec["warnings"].append(f3["WARNING"])
            if f3.get("status") == "done":
                rec["status"] = "done"
    if rec["status"] != "done" and arts and all(a.get("mediaId") for a in arts):
        rec["status"] = "done"
    elif arts:
        rec["status"] = rec["status"] if rec["status"] == "done" else "content_ready"
    return rec


def build_face4(date: str, wdir: str) -> Dict[str, Any]:
    shorts_dir = os.path.join(wdir, "shorts")
    pushed, blocked, fails = [], [], []
    status_json = _load(os.path.join(wdir, "deep_shorts_status.json")) or {}
    status_map = {}
    for v in (status_json.get("videos") or []):
        status_map[v.get("eventId")] = v
    if os.path.isdir(shorts_dir):
        for ev in sorted(os.listdir(shorts_dir)):
            sd = os.path.join(shorts_dir, ev)
            if not os.path.isdir(sd):
                continue
            ev_path = os.path.join(sd, "channels_draft_upload_evidence.json")
            if os.path.exists(ev_path):
                e = _load(ev_path) or {}
                pushed.append({"eid": ev, "objectId": (e.get("response") or {}).get("objectId") or e.get("objectId")})
            else:
                # not pushed -> find reason
                reason = ""
                sq = _load(os.path.join(sd, "stage_quality_report.json")) or {}
                crit = []
                for st in (sq.get("stages") or []):
                    if st.get("pass") is False:
                        cf = st.get("criticalFailures") or []
                        crit.append("%s%s" % (st.get("name", ""), (": " + "/".join(cf)) if cf else ""))
                hg = ((sq.get("hardGates") or {}).get("sourceReuse") or {})
                if hg.get("matches"):
                    reason = "sourceReuse 去重拦截（源已做过）"
                elif crit:
                    reason = "; ".join(crit[:3])
                elif ev in status_map:
                    reason = "phase=%s reviewPass=%s" % (status_map[ev].get("phase"), status_map[ev].get("reviewPass"))
                else:
                    reason = "未生成 / 未推"
                blocked.append({"eid": ev, "reason": reason})
                fails.append({"face": "face4", "eid": ev, "reason": reason})
    rec: Dict[str, Any] = {"status": "pending", "pushed": pushed, "pushedCount": len(pushed),
                            "blocked": blocked, "failReasons": fails}
    if pushed and not [b for b in blocked if "sourceReuse" not in b["reason"]]:
        rec["status"] = "done" if not blocked else "done_with_skips"
    elif pushed:
        rec["status"] = "partial"
    elif blocked:
        rec["status"] = "failed"
    return rec


def build_day(date: str) -> Optional[Dict[str, Any]]:
    wdir = os.path.join(PIPE, "working", date)
    if not os.path.isdir(wdir) and not os.path.exists(os.path.join(STUDIO, "data/drafts", date, "wechat-article.md")):
        return None
    state = _load(os.path.join(wdir, "four_faces_state.json"))
    summ = _latest_summary(wdir)
    if state and isinstance(state, dict) and state.get("faces"):
        faces = state["faces"]
        published = bool(state.get("published"))
    else:
        faces = {
            "face1": build_face1(date, wdir, summ),
            "face2": build_face2(date, wdir),
            "face3": build_face3(date, summ),
            "face4": build_face4(date, wdir),
        }
        published = os.path.exists(os.path.join(STUDIO, "data/drafts", date, ".published")) and \
            os.path.exists(os.path.join(STUDIO, "data/drafts", date, ".channels-published"))
    fail_reasons = []
    for fn, fr in faces.items():
        for x in (fr.get("failReasons") or []):
            fail_reasons.append(x)
        if fr.get("warnings"):
            for w in fr["warnings"]:
                fail_reasons.append({"face": fn, "reason": w, "kind": "warning"})
    done = sum(1 for f in faces.values() if str(f.get("status", "")).startswith("done"))
    return {
        "date": date,
        "faces": faces,
        "published": published,
        "facesDone": done,
        "facesTotal": 4,
        "failReasons": fail_reasons,
        "summaryFile": summ.get("_file") if summ else None,
    }


def main(argv=None):
    argv = argv or sys.argv[1:]
    window = 30
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ledger", "ledger.json")
    if "--window" in argv:
        window = int(argv[argv.index("--window") + 1])
    if "--out" in argv:
        out = argv[argv.index("--out") + 1]
    today = datetime.date.today()
    records = []
    for i in range(window, -2, -1):
        d = (today - datetime.timedelta(days=i)).isoformat()
        try:
            r = build_day(d)
        except Exception as e:
            r = {"date": d, "error": str(e), "faces": {}, "failReasons": []}
        if r:
            records.append(r)
    records.sort(key=lambda r: r["date"], reverse=True)
    payload = {"generatedAt": datetime.datetime.now().astimezone().isoformat(timespec="seconds"),
               "tool": "四面台 / sap-four-faces", "days": records}
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    print("wrote %s (%d days)" % (out, len(records)))


if __name__ == "__main__":
    main()
