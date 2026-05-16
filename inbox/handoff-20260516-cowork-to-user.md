# handoff-20260516-cowork-to-user

- 时间：2026-05-16T16:44:43+0900
- agent：cowork (Claude)
- 涉及：systems/ 软链接补全

## 做了什么
- 补建三条软链接：video-kb / course-codex / course-cc
- systems/ 四条全部就位，已 git commit

## 一处主动判断（请审）
- Ryan 给的 course-codex 是 `file:///.../sap-ai-learning-manager/index.html`
- 蓝图要求 systems/ 下挂的是"系统目录"，索引文件级软链接不利于其他 agent 浏览
- 我把 `systems/course-codex` 指向 **index.html 的父目录** `~/Documents/Obsidian/sap-ai-learning-manager/`
- 如要打开入口：`open ~/sap-hub/systems/course-codex/index.html`
- **如不同意**：跑 `rm ~/sap-hub/systems/course-codex && ln -s "/Users/openclawxiaoer/Documents/Obsidian/sap-ai-learning-manager/index.html" ~/sap-hub/systems/course-codex` 改回文件级

## 下一步是谁的动作
- 用户/大脑：判断 course-codex 的链接策略；若 OK 即可推进下一轮"6 个 _instructions.md 与 sources.yaml"交付
- 执行体：等大脑下一轮规格
