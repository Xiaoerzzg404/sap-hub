# 网站已迁移

SAP 日语口语训练平台的网站源码已从仓库根目录迁到
`projects/4-sap-training/web/` 下。

## 开发

```bash
cd projects/4-sap-training/web
npm install
npm run dev -- --hostname 127.0.0.1 --port 3000
```

## 内容转换

```bash
cd projects/4-sap-training/web
npm run convert:content
```

## 历史

迁移人：codex
迁移日期：2026-05-19（Phase 0）
依据：logs/codex-evolution-roadmap.md
