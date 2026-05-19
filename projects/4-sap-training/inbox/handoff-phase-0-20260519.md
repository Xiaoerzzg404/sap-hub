# Phase 0 交接 · 2026-05-19

## 起始状态
- 起始 commit: b2a20d52c6df0a87b8355bc584f5fede0ba363f4
- 工作分支: codex/phase-0-web-migration
- Phase 0 commit: 75cb43d

## 已做
- [x] git mv 全部源码到 projects/4-sap-training/web/
- [x] 修 convert-content.mjs 路径
- [x] 改 package.json name
- [x] 写 WEB_MOVED.md
- [x] 更新 .gitignore（pre-phase-0 cleanup 已提前加入 web/ runtime ignore，本次确认沿用）
- [x] npm install 通过
- [x] npm run typecheck 通过
- [x] npm run build 通过
- [x] npm run convert:content 通过，24 课重新生成
- [x] data baseline 备份到 .baseline-v0.1.0/
- [x] state JSON 更新
- [x] commit 完成

## 验收命令清单（给 Claude）
```bash
ls /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web/app/page.tsx
ls /Users/openclawxiaoer/sap-hub/app 2>&1   # 应 No such file
cat /Users/openclawxiaoer/sap-hub/WEB_MOVED.md
ls /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web/.baseline-v0.1.0/data-baseline/
cd /Users/openclawxiaoer/sap-hub/projects/4-sap-training/web && npm run typecheck
git -C /Users/openclawxiaoer/sap-hub log --oneline | head -5
git -C /Users/openclawxiaoer/sap-hub log --follow projects/4-sap-training/web/app/page.tsx | head
```

## 结果
- npm install: 通过；输出 2 moderate severity vulnerabilities（Phase 0 范围未做依赖升级）。
- npm run typecheck: 通过。
- npm run build: 通过；Next.js 15.5.18 生成 43 个静态页面/路径。
- npm run convert:content: 通过；Converted 24 lessons, 528 terms, 576 phrases。
- lessons.json 数量检查: 24。
- baseline: projects/4-sap-training/web/.baseline-v0.1.0/data-baseline/ 已生成，按 .gitignore 保留为本地验收备份。

## 遗留 / 风险
- npm install 报 2 个 moderate audit 提示，未在 Phase 0 处理。
- .baseline-v0.1.0/ 按 .gitignore 不入库，但本地目录存在，可供本机 Claude 验收。

## 下一步
等 Claude 验收。验收通过后开 Phase 1（数据模型扩展）。
