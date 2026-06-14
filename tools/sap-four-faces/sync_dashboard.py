#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把 四面台 dashboard + ledger 同步到 7788 console（insight-desk/console），
并幂等注册工具栏入口按钮。canonical 源在本工具目录，worktree 被重置也能再同步恢复。

用法: sync_dashboard.py
"""
from __future__ import annotations
import os, shutil, datetime, sys

HOME = os.path.expanduser("~")
TOOL = os.path.dirname(os.path.abspath(__file__))
CONSOLE = os.environ.get(
    "SAP_FF_CONSOLE",
    os.path.join(HOME, ".codex/worktrees/aa5a/OpenClaw/sap-news-pipeline/insight-desk/console"),
)

SRC_HTML = os.path.join(TOOL, "dashboard", "four-faces.html")
SRC_LEDGER = os.path.join(TOOL, "ledger", "ledger.json")

DST_HTML = os.path.join(CONSOLE, "four-faces.html")
DST_LEDGER_DIR = os.path.join(CONSOLE, "four-faces")
DST_LEDGER = os.path.join(DST_LEDGER_DIR, "ledger.json")

BTN = ('      <a class="tb-btn" style="text-decoration:none" href="four-faces.html" '
       'title="四面台 · 四面流水线状态/内容/发布/失败留痕">◳ 四面台</a>\n')
ANCHOR = '<a class="tb-btn" style="text-decoration:none" href="../published.html"'


def main():
    if not os.path.isdir(CONSOLE):
        print("ERR: console dir not found: %s" % CONSOLE)
        return 1
    # 1. deploy dashboard html
    shutil.copy2(SRC_HTML, DST_HTML)
    # 2. deploy ledger json
    os.makedirs(DST_LEDGER_DIR, exist_ok=True)
    shutil.copy2(SRC_LEDGER, DST_LEDGER)
    print("deployed: four-faces.html + four-faces/ledger.json -> %s" % CONSOLE)
    # 3. register toolbar button (idempotent, with backup)
    chtml = os.path.join(CONSOLE, "console.html")
    if os.path.exists(chtml):
        s = open(chtml, encoding="utf-8").read()
        if "href=\"four-faces.html\"" in s:
            print("toolbar button already registered")
        elif ANCHOR in s:
            ts = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
            shutil.copy2(chtml, chtml + ".bak-fourfaces-" + ts)
            # insert our button right before the 已发布 button line
            idx = s.index(ANCHOR)
            line_start = s.rfind("\n", 0, idx) + 1
            s2 = s[:line_start] + BTN + s[line_start:]
            open(chtml, "w", encoding="utf-8").write(s2)
            print("registered toolbar button (backup: console.html.bak-fourfaces-%s)" % ts)
        else:
            print("WARN: anchor not found in console.html; button NOT inserted. "
                  "Dashboard still reachable at /console/four-faces.html")
    else:
        print("WARN: console.html not found; dashboard still at /console/four-faces.html")
    print("URL: http://127.0.0.1:7788/console/four-faces.html")
    return 0


if __name__ == "__main__":
    sys.exit(main())
